"""Rental endpoints: list, detail, checkout, and check-in."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, serializers, services
from ..database import get_db
from ..schemas import CheckinRequest, CheckoutRequest, RentalOut

router = APIRouter(prefix="/api/rentals", tags=["rentals"])


@router.get("", response_model=list[RentalOut])
def list_rentals(
    rental_status: Optional[str] = None,
    equipment_id: Optional[str] = None,
    site_id: Optional[str] = None,
    operator_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    stmt = select(models.Rental)
    if rental_status is not None:
        stmt = stmt.where(models.Rental.status == rental_status)
    if equipment_id is not None:
        stmt = stmt.where(models.Rental.asset_id == equipment_id)
    if site_id is not None:
        stmt = stmt.where(models.Rental.site_id == site_id)
    if operator_id is not None:
        stmt = stmt.where(models.Rental.operator_id == operator_id)
    rentals = db.scalars(stmt.order_by(models.Rental.id)).all()
    return [serializers.rental_out(r) for r in rentals]


@router.get("/{rental_id}", response_model=RentalOut)
def get_rental(rental_id: str, db: Session = Depends(get_db)):
    rental = db.get(models.Rental, rental_id)
    if rental is None:
        raise HTTPException(status_code=404, detail=f"Rental {rental_id} not found")
    return serializers.rental_out(rental)


@router.post("/checkout", response_model=RentalOut, status_code=201)
def checkout(payload: CheckoutRequest, db: Session = Depends(get_db)):
    rental = services.checkout(
        db,
        equipment_id=payload.equipment_id,
        site_id=payload.site_id,
        operator_id=payload.operator_id,
        customer_id=payload.customer_id,
        expected_return=payload.expected_return,
    )
    return serializers.rental_out(rental)


@router.post("/{rental_id}/checkin", response_model=RentalOut)
def checkin(rental_id: str, payload: CheckinRequest, db: Session = Depends(get_db)):
    rental = services.checkin(db, rental_id=rental_id, check_in=payload.check_in)
    return serializers.rental_out(rental)
