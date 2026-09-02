"""Phase 1 tests: database foundation, seeding, and health/verify endpoints."""
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select, text
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

MODEL_MAP = {
    "assets": models.Asset,
    "sites": models.Site,
    "operators": models.Operator,
    "rentals": models.Rental,
    "telemetry": models.Telemetry,
    "events": models.Event,
    "lifecycle_events": models.LifecycleEvent,
    "maintenance": models.Maintenance,
    "demand_history": models.DemandHistory,
}


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


def test_dataset_file_exists():
    assert config.DATASET_PATH.exists()


@pytest.mark.parametrize("table", sorted(EXPECTED_COUNTS))
def test_row_counts(session, table):
    model = MODEL_MAP[table]
    count = session.scalar(select(func.count()).select_from(model))
    assert count == EXPECTED_COUNTS[table], (
        f"{table}: expected {EXPECTED_COUNTS[table]}, got {count}"
    )


@pytest.mark.parametrize(
    "table", ["assets", "sites", "operators", "rentals", "events", "maintenance"]
)
def test_primary_keys_unique(session, table):
    model = MODEL_MAP[table]
    total = session.scalar(select(func.count()).select_from(model))
    distinct = session.scalar(select(func.count(func.distinct(model.id))))
    assert total == distinct


def test_excel_date_conversion():
    assert seed.excel_to_date(45658) == date(2025, 1, 1)
    assert seed.excel_to_date(46253) == date(2026, 8, 19)


def test_telemetry_date_range(session):
    lo = session.scalar(select(func.min(models.Telemetry.timestamp)))
    hi = session.scalar(select(func.max(models.Telemetry.timestamp)))
    assert lo == date(2025, 1, 1)
    assert hi == date(2026, 8, 19)


def test_assets_current_site_null_preserved(session):
    n = session.scalar(
        select(func.count())
        .select_from(models.Asset)
        .where(models.Asset.current_site_id.is_(None))
    )
    assert n == 24


def test_rentals_check_in_null_preserved(session):
    n = session.scalar(
        select(func.count())
        .select_from(models.Rental)
        .where(models.Rental.check_in.is_(None))
    )
    assert n == 221


def test_foreign_keys_no_orphans(session):
    checks = [
        ("assets", "current_site_id", "sites", "id"),
        ("operators", "primary_site_id", "sites", "id"),
        ("rentals", "asset_id", "assets", "id"),
        ("rentals", "site_id", "sites", "id"),
        ("rentals", "operator_id", "operators", "id"),
        ("telemetry", "asset_id", "assets", "id"),
        ("events", "asset_id", "assets", "id"),
        ("lifecycle_events", "rental_id", "rentals", "id"),
        ("lifecycle_events", "asset_id", "assets", "id"),
        ("lifecycle_events", "site_id", "sites", "id"),
        ("lifecycle_events", "operator_id", "operators", "id"),
        ("maintenance", "asset_id", "assets", "id"),
        ("demand_history", "site_id", "sites", "id"),
    ]
    for child_t, child_c, parent_t, parent_c in checks:
        sql = text(
            f"SELECT COUNT(*) FROM {child_t} c "
            f"LEFT JOIN {parent_t} p ON c.{child_c} = p.{parent_c} "
            f"WHERE c.{child_c} IS NOT NULL AND p.{parent_c} IS NULL"
        )
        orphans = session.execute(sql).scalar()
        assert orphans == 0, f"{child_t}.{child_c} has {orphans} orphan values"


def test_demand_history_unique(session):
    sql = text(
        "SELECT COUNT(DISTINCT date || '|' || site_id || '|' || equipment_type) "
        "FROM demand_history"
    )
    distinct = session.execute(sql).scalar()
    assert distinct == 28320


def test_health_endpoint():
    with TestClient(main.app) as c:
        r = c.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_verify_endpoint(client):
    r = client.get("/verify")
    assert r.status_code == 200
    assert r.json()["row_counts"] == EXPECTED_COUNTS
