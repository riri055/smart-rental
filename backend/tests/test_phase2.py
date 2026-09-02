"""Phase 2 tests: core rental APIs.

Read-only tests run against a freshly seeded temporary database (never the
authoritative development database). Mutation tests run last and are each
self-contained so they do not depend on one another's ordering.
"""
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

from app import config, main, models, seed
from app.database import get_db

EXPECTED_COUNTS = {
    "assets": 100,
    "sites": 8,
    "operators": 50,
    "rentals": 1200,
    "telemetry": 34206,
    "events": 455,
    "lifecycle_events": 1079,
    "maintenance": 400,
    "demand_history": 28320,
}

OPEN_STATUSES = ("Active", "Extended", "Overdue")


@pytest.fixture(scope="module")
def engine(tmp_path_factory):
    eng = create_engine(
        f"sqlite:///{tmp_path_factory.mktemp('db') / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    seed.seed(eng, config.DATASET_PATH)
    yield eng
    eng.dispose()


@pytest.fixture()
def session(engine):
    Session = sessionmaker(bind=engine)
    s = Session()
    yield s
    s.close()


@pytest.fixture()
def client(engine):
    Session = sessionmaker(bind=engine)

    def override_get_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    main.app.dependency_overrides[get_db] = override_get_db
    with TestClient(main.app) as c:
        yield c
    main.app.dependency_overrides.clear()


def _eligible_asset(session):
    open_ids = set(
        session.scalars(
            select(models.Rental.asset_id).where(
                models.Rental.check_in.is_(None),
                models.Rental.status.in_(OPEN_STATUSES),
            )
        ).all()
    )
    stmt = select(models.Asset)
    if open_ids:
        stmt = stmt.where(~models.Asset.id.in_(open_ids))
    return session.scalar(stmt.order_by(models.Asset.id).limit(1))


# ---------------------------------------------------------------------------
# Health / verify (must remain green across read-only tests)
# ---------------------------------------------------------------------------
def test_health_endpoint():
    with TestClient(main.app) as c:
        r = c.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_verify_reports_phase1_counts(client):
    r = client.get("/verify")
    assert r.status_code == 200
    assert r.json()["row_counts"] == EXPECTED_COUNTS


# ---------------------------------------------------------------------------
# Assets
# ---------------------------------------------------------------------------
def test_assets_list_returns_100(client):
    r = client.get("/api/assets")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 100
    assert set(data[0]) == {
        "equipment_id", "equipment_type", "model",
        "current_site_id", "status", "condition_score",
    }


def test_assets_filter_status(client):
    r = client.get("/api/assets", params={"status": "Available"})
    assert r.status_code == 200
    data = r.json()
    assert data and all(a["status"] == "Available" for a in data)


def test_assets_filter_equipment_type(client):
    r = client.get("/api/assets", params={"equipment_type": "Excavator"})
    assert r.status_code == 200
    data = r.json()
    assert data and all(a["equipment_type"] == "Excavator" for a in data)


def test_assets_filter_site(client):
    r = client.get("/api/assets", params={"site_id": "S001"})
    assert r.status_code == 200
    data = r.json()
    assert all(a["current_site_id"] == "S001" for a in data)


def test_known_asset_returned(client):
    r = client.get("/api/assets/EQX0001")
    assert r.status_code == 200
    a = r.json()
    assert a["equipment_id"] == "EQX0001"
    assert a["equipment_type"] == "Excavator"


def test_unknown_asset_404(client):
    assert client.get("/api/assets/EQX9999").status_code == 404


def test_asset_detail_related(client):
    r = client.get("/api/assets/EQX0001")
    a = r.json()
    assert "current_rental" in a and "latest_telemetry" in a and "latest_events" in a


# ---------------------------------------------------------------------------
# Sites / Operators
# ---------------------------------------------------------------------------
def test_sites_returns_8(client):
    r = client.get("/api/sites")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 8
    assert set(data[0]) == {"site_id", "site_name", "site_type", "latitude", "longitude"}


def test_operators_returns_50(client):
    r = client.get("/api/operators")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 50
    assert set(data[0]) == {"operator_id", "operator_name", "primary_site_id"}


# ---------------------------------------------------------------------------
# Rentals (read-only)
# ---------------------------------------------------------------------------
def test_rentals_returns_1200(client):
    r = client.get("/api/rentals")
    assert r.status_code == 200
    assert len(r.json()) == 1200


def test_known_rental(client):
    r = client.get("/api/rentals/R00001")
    assert r.status_code == 200
    data = r.json()
    assert data["rental_id"] == "R00001"
    assert data["rental_status"] == "Completed"


def test_unknown_rental_404(client):
    assert client.get("/api/rentals/R99999").status_code == 404


def test_rentals_filter_status(client):
    r = client.get("/api/rentals", params={"rental_status": "Active"})
    assert r.status_code == 200
    data = r.json()
    assert data and all(x["rental_status"] == "Active" for x in data)


def test_rentals_filter_equipment(client):
    r = client.get("/api/rentals", params={"equipment_id": "EQX0001"})
    assert r.status_code == 200
    data = r.json()
    assert data and all(x["equipment_id"] == "EQX0001" for x in data)


# ---------------------------------------------------------------------------
# Telemetry
# ---------------------------------------------------------------------------
def test_telemetry_known_asset(client):
    r = client.get("/api/assets/EQX0001/telemetry", params={"limit": 10})
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 10
    assert all(t["asset_id"] == "EQX0001" for t in data)
    ts = [t["timestamp"] for t in data]
    assert ts == sorted(ts, reverse=True)  # newest-first


def test_telemetry_fields_correct(client, session):
    r = client.get("/api/assets/EQX0001/telemetry", params={"limit": 1})
    assert r.status_code == 200
    t = r.json()[0]
    row = session.scalar(
        select(models.Telemetry)
        .where(models.Telemetry.asset_id == "EQX0001")
        .order_by(models.Telemetry.timestamp.desc())
        .limit(1)
    )
    assert t["timestamp"] == row.timestamp.isoformat()
    assert t["engine_hours"] == pytest.approx(row.engine_hours)
    assert t["idle_hours"] == pytest.approx(row.idle_hours)
    assert t["fuel_used_l"] == pytest.approx(row.fuel_used_l)
    assert t["engine_temp_c"] == pytest.approx(row.engine_temp_c)
    assert t["latitude"] == pytest.approx(row.lat)
    assert t["longitude"] == pytest.approx(row.lng)


# ---------------------------------------------------------------------------
# Usage (derived metrics)
# ---------------------------------------------------------------------------
def test_usage_math_consistent(client, session):
    r = client.get("/api/assets/EQX0001/usage")
    assert r.status_code == 200
    u = r.json()
    engine = session.scalar(
        select(func.sum(models.Telemetry.engine_hours)).where(
            models.Telemetry.asset_id == "EQX0001"
        )
    )
    idle = session.scalar(
        select(func.sum(models.Telemetry.idle_hours)).where(
            models.Telemetry.asset_id == "EQX0001"
        )
    )
    assert u["engine_hours"] == pytest.approx(engine)
    assert u["idle_hours"] == pytest.approx(idle)
    assert u["operating_hours"] == pytest.approx(u["engine_hours"] - u["idle_hours"])
    assert u["idle_ratio"] == pytest.approx(u["idle_hours"] / u["engine_hours"])
    assert u["utilization"] == pytest.approx(u["operating_hours"] / u["engine_hours"])


def test_usage_summary(client, session):
    r = client.get("/api/usage")
    assert r.status_code == 200
    u = r.json()
    total_engine = session.scalar(select(func.sum(models.Telemetry.engine_hours)))
    total_idle = session.scalar(select(func.sum(models.Telemetry.idle_hours)))
    assert u["total_engine_hours"] == pytest.approx(total_engine)
    assert u["total_idle_hours"] == pytest.approx(total_idle)
    assert u["operating_hours"] == pytest.approx(
        u["total_engine_hours"] - u["total_idle_hours"]
    )
    assert u["utilization"] == pytest.approx(
        u["operating_hours"] / u["total_engine_hours"]
    )
    assert u["telemetry_records"] == EXPECTED_COUNTS["telemetry"]
    assert len(u["by_equipment_type"]) == 6


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------
def test_history_known_asset(client):
    r = client.get("/api/assets/EQX0001/history")
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    assert {x["type"] for x in data} <= {"rental", "lifecycle_event", "event", "maintenance"}
    dates = [x["date"] for x in data]
    assert dates == sorted(dates)


# ---------------------------------------------------------------------------
# Checkout / check-in (mutating — run last, self-contained)
# ---------------------------------------------------------------------------
def test_checkout_creates_rental_and_marks_active(client, session):
    asset = _eligible_asset(session)
    r = client.post(
        "/api/rentals/checkout",
        json={
            "equipment_id": asset.id,
            "site_id": "S001",
            "operator_id": "OP101",
            "customer_id": "CUST999",
            "expected_return": "2026-10-01",
        },
    )
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["equipment_id"] == asset.id
    assert data["rental_status"] == "Active"
    assert data["check_in"] is None
    assert data["check_out"] == date.today().isoformat()
    assert data["expected_return"] == "2026-10-01"
    assert data["customer_id"] == "CUST999"
    assert data["type"] == asset.equipment_type

    a = client.get(f"/api/assets/{asset.id}").json()
    assert a["status"] == "Active"


def test_checkout_duplicate_active_rejected(client, session):
    asset = _eligible_asset(session)
    payload = {
        "equipment_id": asset.id,
        "site_id": "S001",
        "operator_id": "OP101",
        "expected_return": "2026-10-01",
    }
    assert client.post("/api/rentals/checkout", json=payload).status_code == 201
    assert client.post("/api/rentals/checkout", json=payload).status_code == 409


def test_checkout_invalid_asset_rejected(client):
    r = client.post(
        "/api/rentals/checkout",
        json={
            "equipment_id": "EQX9999",
            "site_id": "S001",
            "operator_id": "OP101",
            "expected_return": "2026-10-01",
        },
    )
    assert r.status_code == 404


def test_checkout_invalid_site_rejected(client):
    r = client.post(
        "/api/rentals/checkout",
        json={
            "equipment_id": "EQX0001",
            "site_id": "S999",
            "operator_id": "OP101",
            "expected_return": "2026-10-01",
        },
    )
    assert r.status_code == 400


def test_checkout_invalid_operator_rejected(client):
    r = client.post(
        "/api/rentals/checkout",
        json={
            "equipment_id": "EQX0001",
            "site_id": "S001",
            "operator_id": "OP999",
            "expected_return": "2026-10-01",
        },
    )
    assert r.status_code == 400


def test_checkin_updates_rental_and_asset(client, session):
    asset = _eligible_asset(session)
    checkout = client.post(
        "/api/rentals/checkout",
        json={
            "equipment_id": asset.id,
            "site_id": "S001",
            "operator_id": "OP101",
            "expected_return": "2026-10-01",
        },
    ).json()
    rental_id = checkout["rental_id"]

    r = client.post(f"/api/rentals/{rental_id}/checkin", json={})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["rental_status"] == "Completed"
    assert data["check_in"] == date.today().isoformat()

    a = client.get(f"/api/assets/{asset.id}").json()
    assert a["status"] == "Available"

    # double check-in is rejected
    assert client.post(f"/api/rentals/{rental_id}/checkin", json={}).status_code == 409


def test_checkin_unknown_rental_404(client):
    assert client.post("/api/rentals/R99999/checkin", json={}).status_code == 404
