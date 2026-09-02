"""Phase 5 AI decision-support endpoints (forecasting, anomalies, recommendations)."""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import ai_service
from ..database import get_db
from ..schemas import (
    AnomalyOut,
    DemandForecastOut,
    ImpactOut,
    RecommendationOut,
)

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.get("/demand", response_model=list[DemandForecastOut])
def demand_forecast(
    site_id: Optional[str] = None,
    equipment_type: Optional[str] = None,
    horizon_days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
):
    return ai_service.forecast_demand(
        db, site_id=site_id, equipment_type=equipment_type, horizon_days=horizon_days
    )


@router.get("/anomalies", response_model=list[AnomalyOut])
def anomalies(
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return ai_service.detect_anomalies(db, severity=severity)


@router.get("/recommendations", response_model=list[RecommendationOut])
def recommendations(
    site_id: str,
    equipment_type: str,
    horizon_days: int = Query(14, ge=1, le=90),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    return ai_service.recommend_assets(
        db,
        site_id=site_id,
        equipment_type=equipment_type,
        horizon_days=horizon_days,
        limit=limit,
    )


@router.get("/impact", response_model=ImpactOut)
def impact(
    horizon_days: int = Query(14, ge=1, le=90),
    db: Session = Depends(get_db),
):
    return ai_service.compute_impact(db, horizon_days=horizon_days)
