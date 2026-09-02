"""Convert ORM objects into plain dicts matching the API response schemas."""
from . import models


def site_out(s: models.Site) -> dict:
    return {
        "site_id": s.id,
        "site_name": s.name,
        "site_type": s.site_type,
        "latitude": s.lat,
        "longitude": s.lng,
    }


def operator_out(o: models.Operator) -> dict:
    return {
        "operator_id": o.id,
        "operator_name": o.name,
        "primary_site_id": o.primary_site_id,
    }


def asset_out(a: models.Asset) -> dict:
    return {
        "equipment_id": a.id,
        "equipment_type": a.equipment_type,
        "model": a.model,
        "current_site_id": a.current_site_id,
        "status": a.status,
        "condition_score": a.condition_score,
    }


def telemetry_out(t: models.Telemetry) -> dict:
    return {
        "asset_id": t.asset_id,
        "timestamp": t.timestamp,
        "engine_hours": t.engine_hours,
        "idle_hours": t.idle_hours,
        "fuel_used_l": t.fuel_used_l,
        "engine_temp_c": t.engine_temp_c,
        "latitude": t.lat,
        "longitude": t.lng,
    }


def event_out(e: models.Event) -> dict:
    return {
        "event_id": e.id,
        "event_type": e.event_type,
        "severity": e.severity,
        "resolution_status": e.resolution_status,
        "timestamp": e.timestamp,
    }


def rental_out(r: models.Rental) -> dict:
    return {
        "rental_id": r.id,
        "equipment_id": r.asset_id,
        "type": r.equipment_type,
        "customer_id": r.customer_id,
        "site_id": r.site_id,
        "operator_id": r.operator_id,
        "check_out": r.check_out,
        "expected_return": r.expected_return,
        "check_in": r.check_in,
        "rental_status": r.status,
    }


def lifecycle_out(le: models.LifecycleEvent) -> dict:
    return {
        "rental_id": le.rental_id,
        "event": le.event,
        "customer_id": le.customer_id,
        "site_id": le.site_id,
        "operator_id": le.operator_id,
    }


def maintenance_out(m: models.Maintenance) -> dict:
    return {
        "maintenance_id": m.id,
        "maintenance_type": m.maintenance_type,
        "category": m.category,
        "status": m.status,
    }
