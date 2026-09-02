"""Business logic for the rental lifecycle and usage aggregation.

Routes stay thin: they only parse input and call these functions, which own
transaction/validation rules and take a SQLAlchemy ``Session``.
"""
from datetime import date
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import models

# Rental statuses that mean "still out" (not returned). Taken directly from the
# dataset taxonomy; `Completed` is the only terminal/returned status.
OPEN_RENTAL_STATUSES = ("Active", "Extended", "Overdue")


def checkout(
    db: Session,
    *,
    equipment_id: str,
    site_id: str,
    operator_id: str,
    customer_id: Optional[str],
    expected_return: date,
) -> models.Rental:
    """Create a new rental and mark the asset as Active.

    Uses a transaction: nothing is committed unless all validations pass.
    """
    asset = db.get(models.Asset, equipment_id)
    if asset is None:
        raise HTTPException(status_code=404, detail=f"Asset {equipment_id} not found")

    if db.get(models.Site, site_id) is None:
        raise HTTPException(status_code=400, detail=f"Site {site_id} not found")

    if db.get(models.Operator, operator_id) is None:
        raise HTTPException(status_code=400, detail=f"Operator {operator_id} not found")

    open_rental = db.scalar(
        select(models.Rental)
        .where(
            models.Rental.asset_id == equipment_id,
            models.Rental.check_in.is_(None),
            models.Rental.status.in_(OPEN_RENTAL_STATUSES),
        )
        .limit(1)
    )
    if open_rental is not None:
        raise HTTPException(
            status_code=409,
            detail=f"Asset {equipment_id} already has an active rental ({open_rental.id})",
        )

    rental = models.Rental(
        id=_next_rental_id(db),
        asset_id=equipment_id,
        equipment_type=asset.equipment_type,
        customer_id=customer_id or _next_customer_id(db),
        site_id=site_id,
        operator_id=operator_id,
        check_out=date.today(),
        expected_return=expected_return,
        check_in=None,
        status="Active",
    )
    asset.status = "Active"
    db.add(rental)
    db.commit()
    db.refresh(rental)
    return rental


def checkin(
    db: Session, *, rental_id: str, check_in: Optional[date]
) -> models.Rental:
    """Close an open rental: set check_in, mark Completed, free the asset."""
    rental = db.get(models.Rental, rental_id)
    if rental is None:
        raise HTTPException(status_code=404, detail=f"Rental {rental_id} not found")

    if rental.status == "Completed" or rental.check_in is not None:
        raise HTTPException(
            status_code=409, detail=f"Rental {rental_id} is already checked in"
        )

    rental.check_in = check_in or date.today()
    rental.status = "Completed"

    asset = db.get(models.Asset, rental.asset_id)
    if asset is not None:
        asset.status = "Available"

    db.commit()
    db.refresh(rental)
    return rental


def compute_usage(engine_hours: float, idle_hours: float, record_count: int) -> dict:
    """Derive operating/idle/utilization metrics from summed source values.

    ``engine_hours`` and ``idle_hours`` are sums of per-reading telemetry values
    (source-derived). ``operating_hours``, ``idle_ratio`` and ``utilization`` are
    calculated from those sums and are therefore derived, not stored, values.
    """
    operating_hours = engine_hours - idle_hours
    if engine_hours > 0:
        idle_ratio = idle_hours / engine_hours
        utilization = operating_hours / engine_hours
    else:
        idle_ratio = None
        utilization = None
    return {
        "engine_hours": float(engine_hours),
        "idle_hours": float(idle_hours),
        "operating_hours": float(operating_hours),
        "idle_ratio": idle_ratio,
        "utilization": utilization,
        "record_count": int(record_count),
    }


def usage_summary(
    db: Session, start: Optional[date] = None, end: Optional[date] = None
) -> dict:
    """Aggregate telemetry usage across the fleet, with type/site breakdowns."""
    filters = []
    if start is not None:
        filters.append(models.Telemetry.timestamp >= start)
    if end is not None:
        filters.append(models.Telemetry.timestamp <= end)

    count, engine, idle = db.execute(
        select(
            func.count(models.Telemetry.id),
            func.coalesce(func.sum(models.Telemetry.engine_hours), 0.0),
            func.coalesce(func.sum(models.Telemetry.idle_hours), 0.0),
        ).where(*filters)
    ).one()
    metrics = compute_usage(float(engine), float(idle), int(count))

    by_type_rows = db.execute(
        select(
            models.Asset.equipment_type,
            func.coalesce(func.sum(models.Telemetry.engine_hours), 0.0),
            func.coalesce(func.sum(models.Telemetry.idle_hours), 0.0),
            func.count(models.Telemetry.id),
        )
        .select_from(models.Telemetry)
        .join(models.Asset, models.Asset.id == models.Telemetry.asset_id)
        .where(*filters)
        .group_by(models.Asset.equipment_type)
        .order_by(models.Asset.equipment_type)
    ).all()
    by_equipment_type = [
        {"equipment_type": eq_type, **compute_usage(float(eng), float(idl), int(cnt))}
        for eq_type, eng, idl, cnt in by_type_rows
    ]

    by_site_rows = db.execute(
        select(
            func.coalesce(models.Asset.current_site_id, "unassigned"),
            func.coalesce(func.sum(models.Telemetry.engine_hours), 0.0),
            func.coalesce(func.sum(models.Telemetry.idle_hours), 0.0),
            func.count(models.Telemetry.id),
        )
        .select_from(models.Telemetry)
        .join(models.Asset, models.Asset.id == models.Telemetry.asset_id)
        .where(*filters)
        .group_by(models.Asset.current_site_id)
        .order_by(models.Asset.current_site_id)
    ).all()
    by_site = [
        {"site_id": site, **compute_usage(float(eng), float(idl), int(cnt))}
        for site, eng, idl, cnt in by_site_rows
    ]

    return {
        "total_engine_hours": metrics["engine_hours"],
        "total_idle_hours": metrics["idle_hours"],
        "operating_hours": metrics["operating_hours"],
        "idle_ratio": metrics["idle_ratio"],
        "utilization": metrics["utilization"],
        "telemetry_records": metrics["record_count"],
        "by_equipment_type": by_equipment_type,
        "by_site": by_site,
    }


def latest_telemetry_locations(db: Session) -> list[dict]:
    """Latest telemetry location per asset, one row per asset.

    The Fleet Tracker uses this to place assets at their most recent real
    telemetry reading (never site-derived or jittered coordinates). A window
    function resolves assets that have multiple readings on the same latest
    day deterministically to the highest telemetry row id.
    """
    rn = (
        func.row_number()
        .over(
            partition_by=models.Telemetry.asset_id,
            order_by=(
                models.Telemetry.timestamp.desc(),
                models.Telemetry.id.desc(),
            ),
        )
        .label("rn")
    )
    ranked = select(
        models.Telemetry.asset_id,
        models.Telemetry.timestamp,
        models.Telemetry.lat,
        models.Telemetry.lng,
        rn,
    ).subquery()

    rows = db.execute(
        select(
            ranked.c.asset_id,
            ranked.c.timestamp,
            ranked.c.lat,
            ranked.c.lng,
        )
        .where(ranked.c.rn == 1)
        .order_by(ranked.c.asset_id)
    ).all()

    return [
        {
            "asset_id": asset_id,
            "timestamp": timestamp,
            "latitude": lat,
            "longitude": lng,
        }
        for asset_id, timestamp, lat, lng in rows
    ]


def _next_rental_id(db: Session) -> str:
    last = db.scalar(select(func.max(models.Rental.id)))
    num = (int(last[1:]) + 1) if last else 1
    return f"R{num:05d}"


def _next_customer_id(db: Session) -> str:
    last = db.scalar(select(func.max(models.Rental.customer_id)))
    num = (int(last[4:]) + 1) if last else 1
    return f"CUST{num:03d}"


# ---------------------------------------------------------------------------
# Alert engine
# ---------------------------------------------------------------------------
# Thresholds chosen from the observed dataset distribution so rules actually
# fire: no asset exceeds a 0.5 idle ratio, but a meaningful cohort sits above
# 0.40; a condition score below 60 marks the fleet's worst-condition assets.
EXCESSIVE_IDLE_RATIO = 0.40
CONDITION_SCORE_THRESHOLD = 60.0

# Map open operational events into the same alert taxonomy used by the
# computed rules, plus the recommended remediation for each signal.
EVENT_ALERT_RULES = {
    "Abnormal Fuel Consumption": ("Abnormal Usage", "Investigate"),
    "Excessive Usage + High Temperature": ("Abnormal Usage", "Investigate"),
    "High Engine Temperature": ("Abnormal Usage", "Investigate"),
    "Low Fuel": ("Abnormal Usage", "Investigate"),
    "Geofence Exit": ("Abnormal Usage", "Investigate"),
    "Excessive Idle": ("Excessive Idle", "Reassign"),
    "Excessive Idle / Underutilized": ("Excessive Idle", "Reassign"),
    "Maintenance Due": ("Condition Risk", "Investigate"),
    "No Operator Assigned": ("Unassigned", "Reassign"),
    "Unassigned Equipment / Excessive Idle": ("Unassigned", "Reassign"),
    "Overdue Return": ("Overdue", "Return"),
}

_SEVERITY_ORDER = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}


def _alert(
    alert_id: str,
    *,
    asset_id: str,
    equipment_type: str,
    site_id: Optional[str],
    category: str,
    severity: str,
    timestamp: date,
    explanation: str,
    recommended_action: str,
) -> dict:
    return {
        "alert_id": alert_id,
        "asset_id": asset_id,
        "equipment_type": equipment_type,
        "site_id": site_id,
        "category": category,
        "severity": severity,
        "timestamp": timestamp,
        "explanation": explanation,
        "status": "open",
        "recommended_action": recommended_action,
    }


def _build_alerts(db: Session) -> list[dict]:
    """Evaluate every alert rule against live DB data.

    Alert IDs are deterministic (``alert-<source>-<key>``) so acknowledgement
    state survives re-evaluation.
    """
    alerts: list[dict] = []
    assets = {a.id: a for a in db.scalars(select(models.Asset))}

    # 1. Overdue rentals still out.
    for r in db.scalars(
        select(models.Rental)
        .where(models.Rental.status == "Overdue", models.Rental.check_in.is_(None))
        .order_by(models.Rental.id)
    ):
        alerts.append(
            _alert(
                f"alert-overdue-{r.id}",
                asset_id=r.asset_id,
                equipment_type=r.equipment_type,
                site_id=r.site_id,
                category="Overdue",
                severity="High",
                timestamp=r.expected_return,
                explanation=(
                    f"Rental {r.id} ({r.equipment_type}) was due {r.expected_return} "
                    "and has not been returned."
                ),
                recommended_action="Return",
            )
        )

    # 2. Unassigned assets (no site).
    for a in db.scalars(
        select(models.Asset)
        .where(models.Asset.current_site_id.is_(None))
        .order_by(models.Asset.id)
    ):
        alerts.append(
            _alert(
                f"alert-unassigned-{a.id}",
                asset_id=a.id,
                equipment_type=a.equipment_type,
                site_id=None,
                category="Unassigned",
                severity="Medium",
                timestamp=date.today(),
                explanation=f"Asset {a.id} ({a.model}) has no assigned site.",
                recommended_action="Reassign",
            )
        )

    # 3. Excessive idle (aggregate idle ratio across each asset's telemetry).
    idle_rows = db.execute(
        select(
            models.Telemetry.asset_id,
            func.sum(models.Telemetry.engine_hours),
            func.sum(models.Telemetry.idle_hours),
        ).group_by(models.Telemetry.asset_id)
    ).all()
    for asset_id, engine, idle in idle_rows:
        engine = float(engine or 0.0)
        idle = float(idle or 0.0)
        if engine <= 0:
            continue
        ratio = idle / engine
        if ratio > EXCESSIVE_IDLE_RATIO:
            a = assets.get(asset_id)
            alerts.append(
                _alert(
                    f"alert-idle-{asset_id}",
                    asset_id=asset_id,
                    equipment_type=a.equipment_type if a else "Unknown",
                    site_id=a.current_site_id if a else None,
                    category="Excessive Idle",
                    severity="Medium",
                    timestamp=date.today(),
                    explanation=(
                        f"Asset {asset_id} idle ratio of {ratio:.1%} exceeds the "
                        f"{EXCESSIVE_IDLE_RATIO:.0%} fleet threshold."
                    ),
                    recommended_action="Reassign",
                )
            )

    # 4. Condition risk (low condition score).
    for a in db.scalars(
        select(models.Asset)
        .where(models.Asset.condition_score < CONDITION_SCORE_THRESHOLD)
        .order_by(models.Asset.id)
    ):
        alerts.append(
            _alert(
                f"alert-condition-{a.id}",
                asset_id=a.id,
                equipment_type=a.equipment_type,
                site_id=a.current_site_id,
                category="Condition Risk",
                severity="High",
                timestamp=date.today(),
                explanation=(
                    f"Asset {a.id} condition score {a.condition_score:.1f} is below the "
                    f"{CONDITION_SCORE_THRESHOLD:.0f} maintenance threshold."
                ),
                recommended_action="Investigate",
            )
        )

    # 5. Open operational events.
    for e in db.scalars(
        select(models.Event)
        .where(models.Event.resolution_status == "Open")
        .order_by(models.Event.timestamp.desc(), models.Event.id)
    ):
        category, action = EVENT_ALERT_RULES.get(
            e.event_type, ("Operational", "Investigate")
        )
        a = assets.get(e.asset_id)
        alerts.append(
            _alert(
                f"alert-event-{e.id}",
                asset_id=e.asset_id,
                equipment_type=a.equipment_type if a else "Unknown",
                site_id=a.current_site_id if a else None,
                category=category,
                severity=e.severity,
                timestamp=e.timestamp,
                explanation=f"{e.event_type} reported for asset {e.asset_id}.",
                recommended_action=action,
            )
        )

    # Severity first (Critical -> Low), newest timestamp first within a severity.
    alerts.sort(
        key=lambda x: (
            _SEVERITY_ORDER.get(x["severity"], 9),
            -x["timestamp"].toordinal(),
        )
    )
    return alerts


def evaluate_alerts(db: Session) -> list[dict]:
    """Return all alerts with acknowledgement state merged in."""
    alerts = _build_alerts(db)
    acknowledged = set(db.scalars(select(models.AlertAcknowledgement.alert_id)).all())
    for a in alerts:
        if a["alert_id"] in acknowledged:
            a["status"] = "acknowledged"
    return alerts


def set_alert_status(db: Session, alert_id: str, status: str) -> dict:
    """Acknowledge (or reopen) an alert, validating the id against live rules."""
    match = next(
        (a for a in _build_alerts(db) if a["alert_id"] == alert_id), None
    )
    if match is None:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")

    if status == "acknowledged":
        if db.get(models.AlertAcknowledgement, alert_id) is None:
            db.add(models.AlertAcknowledgement(alert_id=alert_id))
    else:  # reopen
        row = db.get(models.AlertAcknowledgement, alert_id)
        if row is not None:
            db.delete(row)

    db.commit()
    match["status"] = status
    return match
