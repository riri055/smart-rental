"""FastAPI application entrypoint (Phase 1: health + verification only)."""
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import models
from .database import get_db
from .routers import ai, alerts, assets, operators, rentals, sites, telemetry, usage

app = FastAPI(title="Smart Rental Backend", version="0.2.0")

# Allow the Vite dev server (and preview) to call the API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assets.router)
app.include_router(sites.router)
app.include_router(operators.router)
app.include_router(rentals.router)
app.include_router(usage.router)
app.include_router(telemetry.router)
app.include_router(alerts.router)
app.include_router(ai.router)

TABLES = [
    ("assets", models.Asset),
    ("sites", models.Site),
    ("operators", models.Operator),
    ("rentals", models.Rental),
    ("telemetry", models.Telemetry),
    ("events", models.Event),
    ("lifecycle_events", models.LifecycleEvent),
    ("maintenance", models.Maintenance),
    ("demand_history", models.DemandHistory),
]


@app.get("/health")
def health():
    return {"status": "ok", "service": "smart-rental-backend"}


@app.get("/verify")
def verify(db: Session = Depends(get_db)):
    counts = {
        name: db.scalar(select(func.count()).select_from(model))
        for name, model in TABLES
    }
    return {"row_counts": counts}
