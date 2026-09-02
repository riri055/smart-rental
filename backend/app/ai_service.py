"""Phase 5 AI decision-support services.

Three explainable, deterministic capabilities built directly from the seeded
dataset (no neural networks, no external ML APIs):

* Demand forecasting  — weighted recent average + linear trend.
* Anomaly detection   — rule-based telemetry/anomaly flags.
* Recommendations     — transparent weighted scoring of candidate assets.

All "today"-relative logic is anchored to the latest demand-history date in the
dataset (a historical snapshot), not the system clock, so horizon/availability
comparisons stay coherent with the data. Every forecast is labelled as
simulated decision support in the UI.
"""
from datetime import date, timedelta
import math
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import models, services

# ---------------------------------------------------------------------------
# Tunables (documented so each rule is explainable)
# ---------------------------------------------------------------------------
FORECAST_WINDOW_DAYS = 30       # lookback window for the rolling forecast
HIGH_TEMP_THRESHOLD = 105.0     # °C — elevated engine temperature
CRITICAL_TEMP_THRESHOLD = 110.0 # °C — dangerous engine temperature
ABNORMAL_FUEL_RATE = 20.0       # L per engine-hour — ~2× fleet norm (~10.5)
MAX_TRANSFER_DISTANCE_KM = 40.0 # distance scale for transfer-feasibility scoring

# Recommendation score budget (sums to 100).
RECO_WEIGHTS = {
    "type_match": 20.0,
    "availability": 25.0,
    "utilization": 15.0,
    "condition": 15.0,
    "distance": 15.0,
    "risk": 10.0,
}

EXCESSIVE_IDLE_RATIO = services.EXCESSIVE_IDLE_RATIO


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _reference_date(db: Session) -> date:
    """Anchor for all horizon/availability logic (latest demand date)."""
    return db.scalar(select(func.max(models.DemandHistory.date))) or date.today()


def _equipment_types(db: Session) -> list[str]:
    rows = db.scalars(
        select(models.DemandHistory.equipment_type).distinct()
        .order_by(models.DemandHistory.equipment_type)
    ).all()
    return list(rows)


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km."""
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _telemetry_profiles(db: Session) -> dict:
    """Per-asset telemetry aggregates used by anomalies/recommendations/impact."""
    rows = db.execute(
        select(
            models.Telemetry.asset_id,
            func.sum(models.Telemetry.engine_hours),
            func.sum(models.Telemetry.idle_hours),
            func.max(models.Telemetry.engine_temp_c),
            func.max(models.Telemetry.fuel_used_l / models.Telemetry.engine_hours),
            func.min(models.Telemetry.timestamp),
            func.max(models.Telemetry.timestamp),
        )
        .where(models.Telemetry.engine_hours > 0)
        .group_by(models.Telemetry.asset_id)
    ).all()

    profiles = {}
    for asset_id, engine, idle, max_temp, max_fuel, min_ts, max_ts in rows:
        e = float(engine or 0.0)
        i = float(idle or 0.0)
        profiles[asset_id] = {
            "engine_hours": e,
            "idle_hours": i,
            "idle_ratio": (i / e) if e > 0 else None,
            "max_temp": float(max_temp) if max_temp is not None else None,
            "max_fuel_rate": float(max_fuel) if max_fuel is not None else None,
            "min_date": min_ts,
            "max_date": max_ts,
        }
    return profiles


def _open_rentals(db: Session) -> dict:
    """Map asset_id -> its open rental with the furthest expected_return."""
    rentals = db.scalars(
        select(models.Rental).where(
            models.Rental.check_in.is_(None),
            models.Rental.status.in_(services.OPEN_RENTAL_STATUSES),
        )
    ).all()
    result = {}
    for r in rentals:
        cur = result.get(r.asset_id)
        if cur is None or (r.expected_return or date.min) > (cur.expected_return or date.min):
            result[r.asset_id] = r
    return result


def _latest_position(db: Session, asset_id: str) -> Optional[tuple[float, float]]:
    row = db.execute(
        select(models.Telemetry.lat, models.Telemetry.lng)
        .where(models.Telemetry.asset_id == asset_id)
        .order_by(models.Telemetry.timestamp.desc())
        .limit(1)
    ).first()
    return (float(row[0]), float(row[1])) if row else None


def _demand_points(db: Session, site_id: str, equipment_type: str, window: int):
    rows = db.execute(
        select(models.DemandHistory.date, models.DemandHistory.rental_demand)
        .where(
            models.DemandHistory.site_id == site_id,
            models.DemandHistory.equipment_type == equipment_type,
        )
        .order_by(models.DemandHistory.date.desc())
        .limit(window)
    ).all()
    return [(d, float(v)) for d, v in reversed(rows)]


def _avg_and_trend(points):
    vals = [v for _, v in points]
    n = len(vals)
    if n == 0:
        return 0.0, 0.0
    avg = sum(vals) / n
    if n < 2:
        return avg, 0.0
    xs = list(range(n))
    xm = (n - 1) / 2.0
    num = sum((x - xm) * (y - avg) for x, y in zip(xs, vals))
    den = sum((x - xm) ** 2 for x in xs)
    trend = num / den if den else 0.0
    return avg, trend


def _confidence(points) -> str:
    n = len(points)
    if n < 10:
        return "Low"
    vals = [v for _, v in points]
    mean = sum(vals) / n
    if mean == 0:
        return "High"
    var = sum((v - mean) ** 2 for v in vals) / n
    cv = math.sqrt(var) / mean
    if cv <= 0.3:
        return "High"
    if cv <= 0.6:
        return "Medium"
    return "Low"


# ---------------------------------------------------------------------------
# A. Demand forecasting
# ---------------------------------------------------------------------------
def forecast_demand(
    db: Session,
    site_id: Optional[str] = None,
    equipment_type: Optional[str] = None,
    horizon_days: int = 7,
) -> list[dict]:
    """Forecast demand for every requested (site, equipment_type) combination."""
    ref = _reference_date(db)
    sites = {s.id: s for s in db.scalars(select(models.Site))}
    if site_id is not None and site_id not in sites:
        raise HTTPException(status_code=404, detail=f"Site {site_id} not found")

    types = _equipment_types(db)
    if equipment_type is not None and equipment_type not in types:
        return []

    if site_id is not None:
        site_ids = [site_id]
    else:
        site_ids = sorted(sites.keys())

    if equipment_type is not None:
        etypes = [equipment_type]
    else:
        etypes = types

    assets = db.scalars(select(models.Asset)).all()
    open_rentals = _open_rentals(db)

    results = []
    for sid in site_ids:
        for etype in etypes:
            results.append(
                _forecast_one(db, sites[sid], etype, horizon_days, ref, assets, open_rentals)
            )
    return results


def _forecast_one(db, site, etype, horizon, ref, assets, open_rentals) -> dict:
    points = _demand_points(db, site.id, etype, FORECAST_WINDOW_DAYS)
    recent_average, trend = _avg_and_trend(points)
    predicted = round(max(0.0, recent_average + trend * horizon), 1)
    confidence = _confidence(points)

    available, rented, becoming = _site_supply(
        etype, site.id, ref, horizon, assets, open_rentals
    )
    expected = available + becoming
    gap = round(predicted - expected, 1)
    status = _demand_status(predicted, expected)

    fleet_assets = [a for a in assets if a.equipment_type == etype]
    fleet_total = len(fleet_assets)
    fleet_available = sum(1 for a in fleet_assets if a.status in ("Available", "Idle"))

    explanation = _demand_explanation(
        site, etype, horizon, predicted, recent_average, trend,
        expected, fleet_total, fleet_available, gap, status,
    )

    return {
        "site_id": site.id,
        "site_name": site.name,
        "equipment_type": etype,
        "horizon_days": horizon,
        "reference_date": ref,
        "predicted_demand": predicted,
        "recent_average": round(recent_average, 1),
        "trend": round(trend, 3),
        "confidence": confidence,
        "currently_available": available,
        "currently_rented": rented,
        "becoming_available": becoming,
        "expected_available": expected,
        "fleet_total": fleet_total,
        "fleet_available": fleet_available,
        "demand_gap": gap,
        "status": status,
        "explanation": explanation,
        "history": [{"date": d, "demand": v} for d, v in points],
    }


def _site_supply(etype, site_id, ref, horizon, assets, open_rentals):
    # "Available" = in the pool and free to deploy (Available + Idle).
    # "Rented" = currently out (Active + Overdue).
    site_assets = [
        a for a in assets
        if a.equipment_type == etype and a.current_site_id == site_id
    ]
    available = sum(1 for a in site_assets if a.status in ("Available", "Idle"))
    rented = sum(1 for a in site_assets if a.status in ("Active", "Overdue"))
    horizon_end = ref + timedelta(days=horizon)
    becoming = 0
    for a in site_assets:
        if a.status not in ("Active", "Overdue"):
            continue
        r = open_rentals.get(a.id)
        if r is not None and r.expected_return and ref < r.expected_return <= horizon_end:
            becoming += 1
    return available, rented, becoming


def _demand_status(predicted: float, expected: int) -> str:
    need = int(round(predicted))
    if need > expected:
        return "Shortage"
    if need == expected:
        return "Watch"
    return "Sufficient"


def _demand_explanation(
    site, etype, horizon, predicted, recent_average, trend,
    expected, fleet_total, fleet_available, gap, status,
):
    need = int(round(predicted))
    trend_txt = f"{trend:+.2f}"
    if status == "Shortage":
        units = max(1, int(math.ceil(gap)))
        return (
            f"Site {site.id} is forecast to need about {need} {etype}(s) over the next "
            f"{horizon} days (recent daily average {recent_average:.1f}, trend {trend_txt}/day), "
            f"while only {expected} are expected to be available locally. The fleet holds "
            f"{fleet_total} {etype}(s) ({fleet_available} currently free), so consider "
            f"transferring {units} suitable {etype}(s) from another site."
        )
    if status == "Watch":
        return (
            f"Site {site.id} is forecast to need about {need} {etype}(s) over the next "
            f"{horizon} days (recent daily average {recent_average:.1f}), which exactly matches "
            f"the {expected} expected to be available — no buffer remains."
        )
    return (
        f"Site {site.id} is forecast to need about {need} {etype}(s) over the next "
        f"{horizon} days (recent daily average {recent_average:.1f}), comfortably covered by "
        f"the {expected} expected to be available."
    )


# ---------------------------------------------------------------------------
# B. Anomaly detection
# ---------------------------------------------------------------------------
def detect_anomalies(db: Session, severity: Optional[str] = None) -> list[dict]:
    """Rule-based operational anomalies, each with a plain-English explanation."""
    assets = {a.id: a for a in db.scalars(select(models.Asset))}
    profiles = _telemetry_profiles(db)
    anomalies: list[dict] = []

    for aid, a in assets.items():
        p = profiles.get(aid)
        if p is None:
            continue
        period = f"{p['min_date']} → {p['max_date']}"

        if p["idle_ratio"] is not None and p["idle_ratio"] > EXCESSIVE_IDLE_RATIO:
            anomalies.append(
                _anomaly(
                    aid, a, "excessive_idle", "Medium", period, round(p["idle_ratio"], 3),
                    f"Asset {aid} has an idle ratio of {p['idle_ratio']:.0%} over the telemetry "
                    f"period, indicating significant under-utilization.",
                    "Reassign",
                )
            )

        if p["max_temp"] is not None and p["max_temp"] >= HIGH_TEMP_THRESHOLD:
            sev = "Critical" if p["max_temp"] >= CRITICAL_TEMP_THRESHOLD else "High"
            anomalies.append(
                _anomaly(
                    aid, a, "high_engine_temperature", sev, period, round(p["max_temp"], 1),
                    f"Asset {aid} recorded a peak engine temperature of {p['max_temp']:.1f}°C, "
                    f"above the {HIGH_TEMP_THRESHOLD:.0f}°C safe-operating threshold.",
                    "Investigate",
                )
            )

        if p["max_fuel_rate"] is not None and p["max_fuel_rate"] >= ABNORMAL_FUEL_RATE:
            anomalies.append(
                _anomaly(
                    aid, a, "abnormal_fuel_consumption", "High", period,
                    round(p["max_fuel_rate"], 1),
                    f"Asset {aid} showed a peak fuel burn rate of {p['max_fuel_rate']:.1f} "
                    f"L/engine-hour, roughly {p['max_fuel_rate'] / 10.5:.1f}× the fleet norm.",
                    "Investigate",
                )
            )

    for aid, a in assets.items():
        if a.current_site_id is None:
            anomalies.append(
                _anomaly(
                    aid, a, "unassigned_equipment", "Medium", None, None,
                    f"Asset {aid} is operating without an assigned site.",
                    "Reassign",
                )
            )

    if severity is not None:
        anomalies = [a for a in anomalies if a["severity"] == severity]

    order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    anomalies.sort(key=lambda x: (order.get(x["severity"], 9), x["equipment_id"]))
    return anomalies


def _anomaly(aid, asset, anomaly_type, severity, period, score, explanation, action) -> dict:
    return {
        "anomaly_id": f"anom-{anomaly_type}-{aid}",
        "equipment_id": aid,
        "equipment_type": asset.equipment_type,
        "site": asset.current_site_id,
        "severity": severity,
        "anomaly_type": anomaly_type,
        "reference_period": period,
        "score": score,
        "explanation": explanation,
        "recommended_action": action,
    }


# ---------------------------------------------------------------------------
# C. Recommendation engine
# ---------------------------------------------------------------------------
def recommend_assets(
    db: Session,
    site_id: str,
    equipment_type: str,
    horizon_days: int = 14,
    limit: int = 5,
) -> list[dict]:
    """Rank candidate assets of the requested type for a target site."""
    target = db.get(models.Site, site_id)
    if target is None:
        raise HTTPException(status_code=404, detail=f"Site {site_id} not found")

    ref = _reference_date(db)
    sites = {s.id: s for s in db.scalars(select(models.Site))}
    assets = db.scalars(
        select(models.Asset).where(models.Asset.equipment_type == equipment_type)
    ).all()
    profiles = _telemetry_profiles(db)
    open_rentals = _open_rentals(db)

    horizon_end = ref + timedelta(days=horizon_days)
    candidates = []

    for a in assets:
        p = profiles.get(a.id)
        util = (1 - p["idle_ratio"]) if p and p["idle_ratio"] is not None else None

        rental = open_rentals.get(a.id)
        if rental is None:
            availability = "Available"
            avail_score = RECO_WEIGHTS["availability"]
        elif rental.expected_return and ref < rental.expected_return <= horizon_end:
            availability = f"Available soon (due {rental.expected_return})"
            avail_score = 18.0
        else:
            availability = f"Rented ({rental.status})"
            avail_score = 5.0

        util_score = round((1 - util) * RECO_WEIGHTS["utilization"], 1) if util is not None else 7.5
        cond_score = round(a.condition_score / 100.0 * RECO_WEIGHTS["condition"], 1)
        dist = _asset_distance(db, a, sites, target)
        dist_score = round(
            max(0.0, (1 - dist / MAX_TRANSFER_DISTANCE_KM) * RECO_WEIGHTS["distance"]), 1
        )

        penalty, risk_reasons = _risk_penalty(a, p)
        risk_score = max(0.0, RECO_WEIGHTS["risk"] - penalty)

        total = round(
            RECO_WEIGHTS["type_match"] + avail_score + util_score + cond_score + dist_score + risk_score,
            1,
        )

        reasons = [
            f"Matches requested type ({equipment_type})",
            availability,
            f"Utilization {util:.0%} (lower is preferable)" if util is not None else "Utilization unknown",
            f"Condition score {a.condition_score:.0f}/100",
            f"{dist:.1f} km from {site_id}",
            "No open anomalies" if not risk_reasons else ", ".join(risk_reasons),
        ]

        candidates.append(
            {
                "equipment_id": a.id,
                "equipment_type": a.equipment_type,
                "current_site": a.current_site_id,
                "condition_score": a.condition_score,
                "utilization": round(util, 3) if util is not None else None,
                "availability_status": availability,
                "recommendation_score": total,
                "reasons": reasons,
            }
        )

    candidates.sort(key=lambda c: (-c["recommendation_score"], c["equipment_id"]))
    for i, c in enumerate(candidates, 1):
        c["rank"] = i
    return candidates[:limit]


def _asset_distance(db, asset, sites, target) -> float:
    src = sites.get(asset.current_site_id) if asset.current_site_id else None
    if src is not None:
        return _haversine(src.lat, src.lng, target.lat, target.lng)
    pos = _latest_position(db, asset.id)
    if pos is not None:
        return _haversine(pos[0], pos[1], target.lat, target.lng)
    return MAX_TRANSFER_DISTANCE_KM


def _risk_penalty(asset, profile) -> tuple[float, list[str]]:
    penalty = 0.0
    reasons = []
    if profile:
        if profile["idle_ratio"] is not None and profile["idle_ratio"] > EXCESSIVE_IDLE_RATIO:
            penalty += 2.0
            reasons.append("elevated idle")
        if profile["max_temp"] is not None and profile["max_temp"] >= HIGH_TEMP_THRESHOLD:
            penalty += 4.0
            reasons.append("high engine temperature")
        if profile["max_fuel_rate"] is not None and profile["max_fuel_rate"] >= ABNORMAL_FUEL_RATE:
            penalty += 4.0
            reasons.append("abnormal fuel consumption")
    if asset.condition_score < 60:
        penalty += 3.0
        reasons.append("poor condition")
    return penalty, reasons


# ---------------------------------------------------------------------------
# Projected / simulated impact
# ---------------------------------------------------------------------------
def compute_impact(db: Session, horizon_days: int = 14) -> dict:
    """Fleet-level projected impact, clearly a simulation of the dataset state."""
    profiles = _telemetry_profiles(db)
    total_engine = sum(p["engine_hours"] for p in profiles.values())
    total_idle = sum(p["idle_hours"] for p in profiles.values())

    baseline_idle_ratio = (total_idle / total_engine) if total_engine else None
    baseline_utilization = (1 - baseline_idle_ratio) if baseline_idle_ratio is not None else None

    excess = {
        aid: p for aid, p in profiles.items()
        if p["idle_ratio"] is not None and p["idle_ratio"] > EXCESSIVE_IDLE_RATIO
    }
    excess_idle_hours = sum(p["idle_hours"] for p in excess.values())

    ratios = sorted(
        p["idle_ratio"] for p in profiles.values() if p["idle_ratio"] is not None
    )
    median = ratios[len(ratios) // 2] if ratios else None

    reduction = 0.0
    if median is not None:
        for p in excess.values():
            target_idle = median * p["engine_hours"]
            if p["idle_hours"] > target_idle:
                reduction += p["idle_hours"] - target_idle

    projected_idle = total_idle - reduction
    projected_idle_ratio = (projected_idle / total_engine) if total_engine else None

    forecasts = forecast_demand(db, horizon_days=horizon_days)
    total_gap = round(sum(max(0.0, f["demand_gap"]) for f in forecasts), 1)
    shortage_count = sum(1 for f in forecasts if f["status"] == "Shortage")

    assets = db.scalars(select(models.Asset)).all()
    reassignable = 0
    for a in assets:
        p = profiles.get(a.id)
        idle_ratio = p["idle_ratio"] if p else None
        if a.status == "Available" and (
            a.current_site_id is None
            or (idle_ratio is not None and idle_ratio > EXCESSIVE_IDLE_RATIO)
        ):
            reassignable += 1

    return {
        "baseline_utilization": (
            round(baseline_utilization * 100, 1) if baseline_utilization is not None else None
        ),
        "baseline_idle_ratio": (
            round(baseline_idle_ratio * 100, 1) if baseline_idle_ratio is not None else None
        ),
        "excess_idle_asset_count": len(excess),
        "excess_idle_hours": round(excess_idle_hours, 1),
        "projected_idle_ratio": (
            round(projected_idle_ratio * 100, 1) if projected_idle_ratio is not None else None
        ),
        "idle_reduction_hours": round(reduction, 1),
        "total_demand_gap": total_gap,
        "shortage_count": shortage_count,
        "reassignable_assets": reassignable,
    }
