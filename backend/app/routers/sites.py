"""Site reference endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, serializers
from ..database import get_db
from ..schemas import SiteOut

router = APIRouter(prefix="/api/sites", tags=["sites"])


@router.get("", response_model=list[SiteOut])
def list_sites(db: Session = Depends(get_db)):
    sites = db.scalars(select(models.Site).order_by(models.Site.id)).all()
    return [serializers.site_out(s) for s in sites]
