"""Phase 5 tests: demand forecasting, anomaly detection, recommendations, impact.

All AI endpoints are read-only and deterministic; assertions check schema,
filtering, determinism, and that rankings are self-consistent.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app import config, main, models, seed
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


def _first_site(session) -> str:
    return session.scalar(select(models.Site.id).order_by(models.Site.id))


def _first_type(session) -> str:
    return session.scalar(
        select(models.DemandHistory.equipment_type)
        .order_by(models.DemandHistory.equipment_type)
    )


def test_demand_valid_data(client):
    data = client.get("/api/ai/demand").json()
    assert len(data) > 0
    assert set(data[0]) == {
        "site_id", "site_name", "equipment_type", "horizon_days",
        "reference_date", "predicted_demand", "recent_average", "trend",
        "confidence", "currently_available", "currently_rented",
        "becoming_available", "expected_available", "fleet_total",
        "fleet_available", "demand_gap", "status", "explanation", "history",
    }
    for f in data:
        assert f["predicted_demand"] >= 0
        assert f["status"] in ("Sufficient", "Watch", "Shortage")
        assert f["confidence"] in ("Low", "Medium", "High")
        assert isinstance(f["history"], list) and len(f["history"]) > 0


def test_demand_invalid_site_404(client):
    r = client.get("/api/ai/demand", params={"site_id": "S999"})
    assert r.status_code == 404


def test_demand_equipment_filter(client, session):
    etype = _first_type(session)
    data = client.get("/api/ai/demand", params={"equipment_type": etype}).json()
    assert data and all(f["equipment_type"] == etype for f in data)


def test_demand_unknown_equipment_empty(client):
    data = client.get(
        "/api/ai/demand", params={"equipment_type": "Unicycle"}
    ).json()
    assert data == []


def test_demand_deterministic(client):
    a = client.get("/api/ai/demand").json()
    b = client.get("/api/ai/demand").json()
    assert [f["site_id"] for f in a] == [f["site_id"] for f in b]
    assert [f["predicted_demand"] for f in a] == [f["predicted_demand"] for f in b]


def test_anomalies_schema(client):
    data = client.get("/api/ai/anomalies").json()
    assert len(data) > 0
    assert set(data[0]) == {
        "anomaly_id", "equipment_id", "equipment_type", "site", "severity",
        "anomaly_type", "reference_period", "score", "explanation",
        "recommended_action",
    }
    assert all(a["severity"] in ("Critical", "High", "Medium", "Low") for a in data)
    assert all(a["recommended_action"] for a in data)


def test_anomalies_severity_filter(client):
    data = client.get("/api/ai/anomalies", params={"severity": "Critical"}).json()
    assert data and all(a["severity"] == "Critical" for a in data)


def test_recommendation_ranking_and_valid_types(client, session):
    site_id = _first_site(session)
    etype = _first_type(session)
    data = client.get(
        "/api/ai/recommendations",
        params={"site_id": site_id, "equipment_type": etype},
    ).json()
    assert data, "expected at least one recommendation for a valid type"
    assert all(r["equipment_type"] == etype for r in data)
    ranks = [r["rank"] for r in data]
    assert ranks == list(range(1, len(data) + 1))
    scores = [r["recommendation_score"] for r in data]
    assert scores == sorted(scores, reverse=True)
    for r in data:
        assert 0 <= r["recommendation_score"] <= 100
        assert isinstance(r["reasons"], list) and r["reasons"]


def test_recommendation_unknown_site_404(client):
    r = client.get(
        "/api/ai/recommendations",
        params={"site_id": "S999", "equipment_type": "Excavator"},
    )
    assert r.status_code == 404


def test_impact_schema(client):
    data = client.get("/api/ai/impact").json()
    assert set(data) == {
        "baseline_utilization", "baseline_idle_ratio", "excess_idle_asset_count",
        "excess_idle_hours", "projected_idle_ratio", "idle_reduction_hours",
        "total_demand_gap", "shortage_count", "reassignable_assets",
    }
    assert data["excess_idle_asset_count"] >= 0
    assert data["shortage_count"] >= 0
    assert data["reassignable_assets"] >= 0
