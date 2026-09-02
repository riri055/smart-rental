"""CORS configuration tests for the Vite dev server origins."""
import pytest
from fastapi.testclient import TestClient

from app import main

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]


@pytest.mark.parametrize("origin", ALLOWED_ORIGINS)
def test_cors_allows_configured_origin(origin):
    with TestClient(main.app) as client:
        r = client.get("/health", headers={"Origin": origin})
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") == origin


@pytest.mark.parametrize("origin", ALLOWED_ORIGINS)
def test_cors_preflight_allows_configured_origin(origin):
    with TestClient(main.app) as client:
        r = client.options(
            "/health",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
            },
        )
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") == origin


def test_cors_rejects_unconfigured_origin():
    with TestClient(main.app) as client:
        r = client.get("/health", headers={"Origin": "http://evil.example"})
    assert r.status_code == 200
    assert "access-control-allow-origin" not in r.headers
