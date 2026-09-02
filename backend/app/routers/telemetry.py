"""Fleet-wide telemetry location endpoints (latest position per asset)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import services
from ..database import get_db
from ..schemas import LatestTelemetryLocationOut

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


@router.get("/latest", response_model=list[LatestTelemetryLocationOut])
def latest_telemetry_locations(db: Session = Depends(get_db)):
    """Return the latest telemetry location for every asset in a single query."""
    return services.latest_telemetry_locations(db)
