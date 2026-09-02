"""Operator reference endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, serializers
from ..database import get_db
from ..schemas import OperatorOut

router = APIRouter(prefix="/api/operators", tags=["operators"])


@router.get("", response_model=list[OperatorOut])
def list_operators(db: Session = Depends(get_db)):
    operators = db.scalars(select(models.Operator).order_by(models.Operator.id)).all()
    return [serializers.operator_out(o) for o in operators]
