"""Fleet-wide usage summary endpoint."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import services
from ..database import get_db
from ..schemas import UsageSummaryOut

router = APIRouter(prefix="/api/usage", tags=["usage"])


@router.get("", response_model=UsageSummaryOut)
def usage_summary(
    start: Optional[date] = None,
    end: Optional[date] = None,
    db: Session = Depends(get_db),
):
    return services.usage_summary(db, start=start, end=end)
