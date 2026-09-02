"""Pydantic request/response schemas for the Phase 2 rental APIs.

Field names follow the API contract (snake_case JSON), which intentionally
differ from some SQLAlchemy column names (e.g. `equipment_id` vs `asset_id`).
"""
from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field


class SiteOut(BaseModel):
    site_id: str
    site_name: str
    site_type: str
    latitude: float
    longitude: float


class OperatorOut(BaseModel):
    operator_id: str
    operator_name: str
    primary_site_id: str


class AssetOut(BaseModel):
    equipment_id: str
    equipment_type: str
    model: str
    current_site_id: Optional[str]
    status: str
    condition_score: float


class TelemetryOut(BaseModel):
    asset_id: str
    timestamp: date
    engine_hours: float
    idle_hours: float
    fuel_used_l: float
    engine_temp_c: float
    latitude: float
    longitude: float


class EventOut(BaseModel):
    event_id: str
    event_type: str
    severity: str
    resolution_status: str
    timestamp: date


class RentalOut(BaseModel):
    rental_id: str
    equipment_id: str
    type: str
    customer_id: str
    site_id: str
    operator_id: str
    check_out: date
    expected_return: date
    check_in: Optional[date]
    rental_status: str


class AssetDetailOut(AssetOut):
    current_rental: Optional[RentalOut] = None
    latest_telemetry: Optional[TelemetryOut] = None
    latest_events: list[EventOut] = Field(default_factory=list)


class UsageOut(BaseModel):
    equipment_id: str
    record_count: int
    engine_hours: float
    idle_hours: float
    operating_hours: float
    idle_ratio: Optional[float]
    utilization: Optional[float]


class UsageSummaryOut(BaseModel):
    total_engine_hours: float
    total_idle_hours: float
    operating_hours: float
    idle_ratio: Optional[float]
    utilization: Optional[float]
    telemetry_records: int
    by_equipment_type: list[dict]
    by_site: list[dict]


class CheckoutRequest(BaseModel):
    equipment_id: str
    site_id: str
    operator_id: str
    customer_id: Optional[str] = None
    expected_return: date


class CheckinRequest(BaseModel):
    check_in: Optional[date] = None


class HistoryItemOut(BaseModel):
    type: str
    date: date
    data: dict


class AlertOut(BaseModel):
    alert_id: str
    asset_id: str
    equipment_type: str
    site_id: Optional[str]
    category: str
    severity: str
    timestamp: date
    explanation: str
    status: str
    recommended_action: str


class AlertUpdateRequest(BaseModel):
    status: Literal["open", "acknowledged"]


# ---------------------------------------------------------------------------
# Phase 5 — AI decision support
# ---------------------------------------------------------------------------
class DemandHistoryPointOut(BaseModel):
    date: date
    demand: float


class DemandForecastOut(BaseModel):
    site_id: str
    site_name: str
    equipment_type: str
    horizon_days: int
    reference_date: date
    predicted_demand: float
    recent_average: float
    trend: float
    confidence: str
    currently_available: int
    currently_rented: int
    becoming_available: int
    expected_available: int
    fleet_total: int
    fleet_available: int
    demand_gap: float
    status: str
    explanation: str
    history: list[DemandHistoryPointOut]


class AnomalyOut(BaseModel):
    anomaly_id: str
    equipment_id: str
    equipment_type: str
    site: Optional[str]
    severity: str
    anomaly_type: str
    reference_period: Optional[str]
    score: Optional[float]
    explanation: str
    recommended_action: str


class RecommendationOut(BaseModel):
    rank: int
    equipment_id: str
    equipment_type: str
    current_site: Optional[str]
    condition_score: float
    utilization: Optional[float]
    availability_status: str
    recommendation_score: float
    reasons: list[str]


class ImpactOut(BaseModel):
    baseline_utilization: Optional[float]
    baseline_idle_ratio: Optional[float]
    excess_idle_asset_count: int
    excess_idle_hours: float
    projected_idle_ratio: Optional[float]
    idle_reduction_hours: float
    total_demand_gap: float
    shortage_count: int
    reassignable_assets: int
