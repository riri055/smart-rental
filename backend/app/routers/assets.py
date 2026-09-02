"""Asset endpoints: list, detail, telemetry, usage, and history."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models, serializers
from ..database import get_db
from ..schemas import (
    AssetDetailOut,
    AssetOut,
    HistoryItemOut,
    TelemetryOut,
    UsageOut,
)
from ..services import OPEN_RENTAL_STATUSES, compute_usage

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.get("", response_model=list[AssetOut])
def list_assets(
    status: Optional[str] = None,
    equipment_type: Optional[str] = None,
    site_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    stmt = select(models.Asset)
    if status is not None:
        stmt = stmt.where(models.Asset.status == status)
    if equipment_type is not None:
        stmt = stmt.where(models.Asset.equipment_type == equipment_type)
    if site_id is not None:
        stmt = stmt.where(models.Asset.current_site_id == site_id)
    assets = db.scalars(stmt.order_by(models.Asset.id)).all()
    return [serializers.asset_out(a) for a in assets]


@router.get("/{equipment_id}", response_model=AssetDetailOut)
def get_asset(equipment_id: str, db: Session = Depends(get_db)):
    asset = db.get(models.Asset, equipment_id)
    if asset is None:
        raise HTTPException(status_code=404, detail=f"Asset {equipment_id} not found")

    current_rental = db.scalar(
        select(models.Rental)
        .where(
            models.Rental.asset_id == equipment_id,
            models.Rental.check_in.is_(None),
            models.Rental.status.in_(OPEN_RENTAL_STATUSES),
        )
        .order_by(models.Rental.check_out.desc())
        .limit(1)
    )
    latest_telemetry = db.scalar(
        select(models.Telemetry)
        .where(models.Telemetry.asset_id == equipment_id)
        .order_by(models.Telemetry.timestamp.desc())
        .limit(1)
    )
    latest_events = db.scalars(
        select(models.Event)
        .where(models.Event.asset_id == equipment_id)
        .order_by(models.Event.timestamp.desc())
        .limit(5)
    ).all()

    result = serializers.asset_out(asset)
    result["current_rental"] = (
        serializers.rental_out(current_rental) if current_rental else None
    )
    result["latest_telemetry"] = (
        serializers.telemetry_out(latest_telemetry) if latest_telemetry else None
    )
    result["latest_events"] = [serializers.event_out(e) for e in latest_events]
    return result


@router.get("/{equipment_id}/telemetry", response_model=list[TelemetryOut])
def asset_telemetry(
    equipment_id: str,
    limit: int = Query(100, ge=1, le=1000),
    start: Optional[date] = None,
    end: Optional[date] = None,
    db: Session = Depends(get_db),
):
    if db.get(models.Asset, equipment_id) is None:
        raise HTTPException(status_code=404, detail=f"Asset {equipment_id} not found")

    stmt = select(models.Telemetry).where(models.Telemetry.asset_id == equipment_id)
    if start is not None:
        stmt = stmt.where(models.Telemetry.timestamp >= start)
    if end is not None:
        stmt = stmt.where(models.Telemetry.timestamp <= end)
    # Newest-first ordering (documented contract).
    rows = db.scalars(stmt.order_by(models.Telemetry.timestamp.desc()).limit(limit)).all()
    return [serializers.telemetry_out(t) for t in rows]


@router.get("/{equipment_id}/usage", response_model=UsageOut)
def asset_usage(
    equipment_id: str,
    start: Optional[date] = None,
    end: Optional[date] = None,
    db: Session = Depends(get_db),
):
    if db.get(models.Asset, equipment_id) is None:
        raise HTTPException(status_code=404, detail=f"Asset {equipment_id} not found")

    filters = [models.Telemetry.asset_id == equipment_id]
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
    return {"equipment_id": equipment_id, **metrics}


@router.get("/{equipment_id}/history", response_model=list[HistoryItemOut])
def asset_history(equipment_id: str, db: Session = Depends(get_db)):
    if db.get(models.Asset, equipment_id) is None:
        raise HTTPException(status_code=404, detail=f"Asset {equipment_id} not found")

    items: list[dict] = []
    for r in db.scalars(
        select(models.Rental)
        .where(models.Rental.asset_id == equipment_id)
        .order_by(models.Rental.check_out)
    ):
        items.append({"type": "rental", "date": r.check_out, "data": serializers.rental_out(r)})
    for le in db.scalars(
        select(models.LifecycleEvent)
        .where(models.LifecycleEvent.asset_id == equipment_id)
        .order_by(models.LifecycleEvent.timestamp)
    ):
        items.append(
            {"type": "lifecycle_event", "date": le.timestamp, "data": serializers.lifecycle_out(le)}
        )
    for e in db.scalars(
        select(models.Event)
        .where(models.Event.asset_id == equipment_id)
        .order_by(models.Event.timestamp)
    ):
        items.append({"type": "event", "date": e.timestamp, "data": serializers.event_out(e)})
    for m in db.scalars(
        select(models.Maintenance)
        .where(models.Maintenance.asset_id == equipment_id)
        .order_by(models.Maintenance.date)
    ):
        items.append(
            {"type": "maintenance", "date": m.date, "data": serializers.maintenance_out(m)}
        )

    items.sort(key=lambda x: x["date"])
    return items
