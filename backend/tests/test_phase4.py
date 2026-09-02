"""Phase 4 tests: the real alert engine and alert acknowledgement.

Read-only tests assert that each alert rule agrees with the source data;
mutation tests (acknowledge/reopen) are self-contained and restore state.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

from app import config, main, models, seed, services
from app.database import get_db


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


def test_alerts_list_nonempty_and_fields(client):
    r = client.get("/api/alerts")
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    assert set(data[0]) == {
        "alert_id", "asset_id", "equipment_type", "site_id",
        "category", "severity", "timestamp", "explanation",
        "status", "recommended_action",
    }
    assert all(a["status"] in ("open", "acknowledged") for a in data)


def test_alerts_sorted_severity_then_newest(client):
    data = client.get("/api/alerts").json()
    order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    keys = [
        (order.get(a["severity"], 9), a["timestamp"])
        for a in data
    ]
    # severity ascending, timestamp descending
    for (s0, t0), (s1, t1) in zip(keys, keys[1:]):
        assert s0 < s1 or (s0 == s1 and t0 >= t1)


def test_alerts_overdue_count_matches(client, session):
    overdue_rentals = session.scalar(
        select(func.count()).select_from(models.Rental).where(
            models.Rental.status == "Overdue",
            models.Rental.check_in.is_(None),
        )
    )
    overdue_events = session.scalar(
        select(func.count()).select_from(models.Event).where(
            models.Event.resolution_status == "Open",
            models.Event.event_type == "Overdue Return",
        )
    )
    data = client.get("/api/alerts", params={"category": "Overdue"}).json()
    assert len(data) == overdue_rentals + overdue_events


def test_alerts_unassigned_count_matches(client, session):
    unassigned_assets = session.scalar(
        select(func.count()).select_from(models.Asset).where(
            models.Asset.current_site_id.is_(None)
        )
    )
    unassigned_events = session.scalar(
        select(func.count()).select_from(models.Event).where(
            models.Event.resolution_status == "Open",
            models.Event.event_type.in_(
                ["No Operator Assigned", "Unassigned Equipment / Excessive Idle"]
            ),
        )
    )
    data = client.get("/api/alerts", params={"category": "Unassigned"}).json()
    assert len(data) == unassigned_assets + unassigned_events


def test_alerts_excessive_idle_count_matches(client, session):
    rows = session.execute(
        select(
            models.Telemetry.asset_id,
            func.sum(models.Telemetry.engine_hours),
            func.sum(models.Telemetry.idle_hours),
        ).group_by(models.Telemetry.asset_id)
    ).all()
    computed = sum(
        1
        for _, e, i in rows
        if float(e or 0.0) > 0
        and float(i or 0.0) / float(e or 0.0) > services.EXCESSIVE_IDLE_RATIO
    )
    idle_events = session.scalar(
        select(func.count()).select_from(models.Event).where(
            models.Event.resolution_status == "Open",
            models.Event.event_type.in_(
                ["Excessive Idle", "Excessive Idle / Underutilized"]
            ),
        )
    )
    data = client.get("/api/alerts", params={"category": "Excessive Idle"}).json()
    assert len(data) == computed + idle_events


def test_alerts_condition_risk_count_matches(client, session):
    low_score = session.scalar(
        select(func.count()).select_from(models.Asset).where(
            models.Asset.condition_score < services.CONDITION_SCORE_THRESHOLD
        )
    )
    maint_events = session.scalar(
        select(func.count()).select_from(models.Event).where(
            models.Event.resolution_status == "Open",
            models.Event.event_type == "Maintenance Due",
        )
    )
    data = client.get("/api/alerts", params={"category": "Condition Risk"}).json()
    assert len(data) == low_score + maint_events


def test_alerts_filter_severity(client):
    data = client.get("/api/alerts", params={"severity": "Critical"}).json()
    assert data and all(a["severity"] == "Critical" for a in data)


def test_alerts_filter_status(client):
    data = client.get("/api/alerts", params={"status": "open"}).json()
    assert data and all(a["status"] == "open" for a in data)


def test_alerts_filter_asset(client):
    first = client.get("/api/alerts").json()[0]
    filtered = client.get(
        "/api/alerts", params={"asset_id": first["asset_id"]}
    ).json()
    assert filtered and all(a["asset_id"] == first["asset_id"] for a in filtered)


def test_alert_acknowledge_and_reopen(client, session):
    alert = next(
        a for a in client.get("/api/alerts").json() if a["status"] == "open"
    )
    alert_id = alert["alert_id"]

    r = client.patch(f"/api/alerts/{alert_id}", json={"status": "acknowledged"})
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "acknowledged"

    acked = client.get("/api/alerts", params={"status": "acknowledged"}).json()
    assert any(a["alert_id"] == alert_id for a in acked)
    assert session.get(models.AlertAcknowledgement, alert_id) is not None

    r2 = client.patch(f"/api/alerts/{alert_id}", json={"status": "open"})
    assert r2.status_code == 200
    assert r2.json()["status"] == "open"
    assert session.get(models.AlertAcknowledgement, alert_id) is None


def test_alert_update_unknown_404(client):
    r = client.patch(
        "/api/alerts/alert-nope-XXXX", json={"status": "acknowledged"}
    )
    assert r.status_code == 404


def test_alert_update_invalid_status_rejected(client):
    alert = client.get("/api/alerts").json()[0]
    r = client.patch(
        f"/api/alerts/{alert['alert_id']}", json={"status": "bogus"}
    )
    assert r.status_code == 422
