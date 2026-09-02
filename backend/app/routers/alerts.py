"""Fleet alert endpoints: list/filter and acknowledge."""
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import services
from ..database import get_db
from ..schemas import AlertOut, AlertUpdateRequest

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertOut])
def list_alerts(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    asset_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    alerts = services.evaluate_alerts(db)
    if category is not None:
        alerts = [a for a in alerts if a["category"] == category]
    if severity is not None:
        alerts = [a for a in alerts if a["severity"] == severity]
    if status is not None:
        alerts = [a for a in alerts if a["status"] == status]
    if asset_id is not None:
        alerts = [a for a in alerts if a["asset_id"] == asset_id]
    return alerts


@router.patch("/{alert_id}", response_model=AlertOut)
def update_alert(alert_id: str, payload: AlertUpdateRequest, db: Session = Depends(get_db)):
    return services.set_alert_status(db, alert_id, payload.status)
