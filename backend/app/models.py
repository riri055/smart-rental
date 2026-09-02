"""SQLAlchemy ORM models for the Smart Rental backend.

Schema is derived directly from data/CAT_dataset.xlsx (the source of truth).
"""
from datetime import date

from sqlalchemy import Date, Float, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Site(Base):
    __tablename__ = "sites"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    site_type: Mapped[str] = mapped_column(String(50), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)


class Operator(Base):
    __tablename__ = "operators"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    primary_site_id: Mapped[str] = mapped_column(
        String(10), ForeignKey("sites.id"), nullable=False
    )


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    equipment_type: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(50), nullable=False)
    current_site_id: Mapped[str | None] = mapped_column(
        String(10), ForeignKey("sites.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    condition_score: Mapped[float] = mapped_column(Float, nullable=False)


class Rental(Base):
    __tablename__ = "rentals"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    asset_id: Mapped[str] = mapped_column(String(10), ForeignKey("assets.id"), nullable=False)
    equipment_type: Mapped[str] = mapped_column(String(50), nullable=False)
    customer_id: Mapped[str] = mapped_column(String(10), nullable=False)
    site_id: Mapped[str] = mapped_column(String(10), ForeignKey("sites.id"), nullable=False)
    operator_id: Mapped[str] = mapped_column(String(10), ForeignKey("operators.id"), nullable=False)
    check_out: Mapped[date] = mapped_column(Date, nullable=False)
    expected_return: Mapped[date] = mapped_column(Date, nullable=False)
    check_in: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)


class Telemetry(Base):
    __tablename__ = "telemetry"
    __table_args__ = (Index("ix_telemetry_asset_timestamp", "asset_id", "timestamp"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_id: Mapped[str] = mapped_column(String(10), ForeignKey("assets.id"), nullable=False)
    timestamp: Mapped[date] = mapped_column(Date, nullable=False)
    engine_hours: Mapped[float] = mapped_column(Float, nullable=False)
    idle_hours: Mapped[float] = mapped_column(Float, nullable=False)
    fuel_used_l: Mapped[float] = mapped_column(Float, nullable=False)
    engine_temp_c: Mapped[float] = mapped_column(Float, nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    asset_id: Mapped[str] = mapped_column(String(10), ForeignKey("assets.id"), nullable=False)
    timestamp: Mapped[date] = mapped_column(Date, nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    resolution_status: Mapped[str] = mapped_column(String(20), nullable=False)


class LifecycleEvent(Base):
    __tablename__ = "lifecycle_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    rental_id: Mapped[str] = mapped_column(String(10), ForeignKey("rentals.id"), nullable=False)
    asset_id: Mapped[str] = mapped_column(String(10), ForeignKey("assets.id"), nullable=False)
    timestamp: Mapped[date] = mapped_column(Date, nullable=False)
    event: Mapped[str] = mapped_column(String(20), nullable=False)
    customer_id: Mapped[str] = mapped_column(String(10), nullable=False)
    site_id: Mapped[str] = mapped_column(String(10), ForeignKey("sites.id"), nullable=False)
    operator_id: Mapped[str] = mapped_column(String(10), ForeignKey("operators.id"), nullable=False)


class Maintenance(Base):
    __tablename__ = "maintenance"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    asset_id: Mapped[str] = mapped_column(String(10), ForeignKey("assets.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    maintenance_type: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)


class DemandHistory(Base):
    __tablename__ = "demand_history"
    __table_args__ = (
        UniqueConstraint("date", "site_id", "equipment_type", name="uq_demand_history"),
        Index("ix_demand_history_site_type_date", "site_id", "equipment_type", "date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    site_id: Mapped[str] = mapped_column(String(10), ForeignKey("sites.id"), nullable=False)
    equipment_type: Mapped[str] = mapped_column(String(50), nullable=False)
    rental_demand: Mapped[int] = mapped_column(Integer, nullable=False)


class AlertAcknowledgement(Base):
    """Tracks which alerts a user has acknowledged.

    Alerts are computed on the fly by the rule engine; only their
    acknowledgement state is persisted. The presence of a row means
    ``acknowledged``, absence means ``open``.
    """

    __tablename__ = "alert_acknowledgements"

    alert_id: Mapped[str] = mapped_column(String(80), primary_key=True)
