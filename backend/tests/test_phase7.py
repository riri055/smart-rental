"""Phase 7 tests: latest telemetry location endpoint for the Fleet Tracker.

Read-only tests run against a freshly seeded temporary database. They verify
the aggregated endpoint returns exactly one real (non-jittered) location per
asset, matching the asset's newest telemetry reading.
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


def test_latest_telemetry_returns_one_per_asset(client):
    r = client.get("/api/telemetry/latest")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 100
    assert set(data[0]) == {"asset_id", "timestamp", "latitude", "longitude"}
    ids = [d["asset_id"] for d in data]
    assert len(set(ids)) == 100
    assert ids == sorted(ids)  # ordered by asset id


def test_latest_telemetry_matches_newest_reading(client, session):
    data = client.get("/api/telemetry/latest").json()
    by_id = {d["asset_id"]: d for d in data}
    for aid in ("EQX0001", "EQX0050", "EQX0100"):
        row = session.execute(
            select(
                models.Telemetry.timestamp,
                models.Telemetry.lat,
                models.Telemetry.lng,
            )
            .where(models.Telemetry.asset_id == aid)
            .order_by(
                models.Telemetry.timestamp.desc(),
                models.Telemetry.id.desc(),
            )
            .limit(1)
        ).one()
        assert by_id[aid]["timestamp"] == row.timestamp.isoformat()
        assert by_id[aid]["latitude"] == pytest.approx(row.lat)
        assert by_id[aid]["longitude"] == pytest.approx(row.lng)


def test_latest_telemetry_not_site_derived(client, session):
    """Latest locations are real telemetry readings, not site coordinates."""
    sites = {
        s.id: (s.lat, s.lng) for s in session.scalars(select(models.Site)).all()
    }
    data = client.get("/api/telemetry/latest").json()
    # At least one site-assigned asset must differ from its site coordinate,
    # proving we are not placing markers at site lat/lng.
    differed = 0
    for d in data:
        asset = session.get(models.Asset, d["asset_id"])
        if asset.current_site_id and asset.current_site_id in sites:
            slat, slng = sites[asset.current_site_id]
            if abs(d["latitude"] - slat) > 1e-9 or abs(d["longitude"] - slng) > 1e-9:
                differed += 1
    assert differed > 0
