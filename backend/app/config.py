"""Configuration for the Smart Rental backend."""
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent  # .../backend
PROJECT_ROOT = BACKEND_DIR.parent

DATASET_PATH = PROJECT_ROOT / "data" / "CAT_dataset.xlsx"
DATABASE_PATH = BACKEND_DIR / "smart_rental.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"
