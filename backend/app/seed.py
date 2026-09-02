"""Import data/CAT_dataset.xlsx into SQLite.

The seed is repeatable: it drops and recreates all tables, then imports every
sheet in dependency order (parents before children) so foreign keys resolve.
"""
from datetime import date, datetime, timedelta

import openpyxl
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import models
from .database import Base

# Excel serial epoch: 45658 -> 2025-01-01 (verified against the dataset).
EXCEL_EPOCH = date(1899, 12, 30)


def excel_to_date(value) -> date:
    """Convert an Excel date serial (or already-parsed datetime) to a datetime.date."""
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return EXCEL_EPOCH + timedelta(days=int(round(float(value))))


def _load_rows(ws, column_map, date_cols=(), float_cols=(), int_cols=()):
    """Read a worksheet into a list of dicts keyed by model field names.

    column_map: {sheet_column_name: model_field_name}
    Empty cells and empty strings become None (preserving meaningful nulls).
    """
    rows = ws.iter_rows(values_only=True)
    header = next(rows)
    index = {name: i for i, name in enumerate(header)}

    records = []
    for row in rows:
        record = {}
        for src, dst in column_map.items():
            raw = row[index[src]]
            if raw is None or (isinstance(raw, str) and raw.strip() == ""):
                record[dst] = None
            elif src in date_cols:
                record[dst] = excel_to_date(raw)
            elif src in float_cols:
                record[dst] = float(raw)
            elif src in int_cols:
                record[dst] = int(float(raw))
            else:
                record[dst] = str(raw).strip()
        records.append(record)
    return records


def reset_db(engine):
    """Drop and recreate all tables."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed(engine, dataset_path) -> dict:
    """Create tables and import the workbook. Returns per-table row counts."""
    reset_db(engine)

    wb = openpyxl.load_workbook(dataset_path, read_only=True, data_only=True)

    with Session(engine) as session:
        # 1. Sites (parent of many)
        session.bulk_insert_mappings(
            models.Site,
            _load_rows(
                wb["Sites"],
                {"Site_ID": "id", "Site_Name": "name", "Site_Type": "site_type",
                 "Latitude": "lat", "Longitude": "lng"},
                float_cols={"Latitude", "Longitude"},
            ),
        )

        # 2. Operators
        session.bulk_insert_mappings(
            models.Operator,
            _load_rows(
                wb["Operators"],
                {"Operator_ID": "id", "Operator_Name": "name",
                 "Primary_Site_ID": "primary_site_id"},
            ),
        )

        # 3. Assets
        session.bulk_insert_mappings(
            models.Asset,
            _load_rows(
                wb["Assets"],
                {"Equipment_ID": "id", "Type": "equipment_type",
                 "Current_Site_ID": "current_site_id", "Status": "status",
                 "Model": "model", "Condition_Score": "condition_score"},
                float_cols={"Condition_Score"},
            ),
        )

        # 4. Rentals
        session.bulk_insert_mappings(
            models.Rental,
            _load_rows(
                wb["Rentals"],
                {"Rental_ID": "id", "Equipment_ID": "asset_id", "Type": "equipment_type",
                 "Customer_ID": "customer_id", "Site_ID": "site_id",
                 "Operator_ID": "operator_id", "Check_Out": "check_out",
                 "Expected_Return": "expected_return", "Check_In": "check_in",
                 "Rental_Status": "status"},
                date_cols={"Check_Out", "Expected_Return", "Check_In"},
            ),
        )

        # 5. Telemetry
        session.bulk_insert_mappings(
            models.Telemetry,
            _load_rows(
                wb["Telemetry"],
                {"Equipment_ID": "asset_id", "Timestamp": "timestamp",
                 "Engine_Hours": "engine_hours", "Idle_Hours": "idle_hours",
                 "Fuel_Used_L": "fuel_used_l", "Engine_Temp_C": "engine_temp_c",
                 "Latitude": "lat", "Longitude": "lng"},
                date_cols={"Timestamp"},
                float_cols={"Engine_Hours", "Idle_Hours", "Fuel_Used_L",
                            "Engine_Temp_C", "Latitude", "Longitude"},
            ),
        )

        # 6. Events
        session.bulk_insert_mappings(
            models.Event,
            _load_rows(
                wb["Events"],
                {"Event_ID": "id", "Equipment_ID": "asset_id", "Timestamp": "timestamp",
                 "Event_Type": "event_type", "Severity": "severity",
                 "Resolution_Status": "resolution_status"},
                date_cols={"Timestamp"},
            ),
        )

        # 7. Lifecycle_Events
        session.bulk_insert_mappings(
            models.LifecycleEvent,
            _load_rows(
                wb["Lifecycle_Events"],
                {"Rental_ID": "rental_id", "Equipment_ID": "asset_id",
                 "Timestamp": "timestamp", "Event": "event",
                 "Customer_ID": "customer_id", "Site_ID": "site_id",
                 "Operator_ID": "operator_id"},
                date_cols={"Timestamp"},
            ),
        )

        # 8. Maintenance
        session.bulk_insert_mappings(
            models.Maintenance,
            _load_rows(
                wb["Maintenance"],
                {"Maintenance_ID": "id", "Equipment_ID": "asset_id", "Date": "date",
                 "Maintenance_Type": "maintenance_type", "Category": "category",
                 "Status": "status"},
                date_cols={"Date"},
            ),
        )

        # 9. Demand_History
        session.bulk_insert_mappings(
            models.DemandHistory,
            _load_rows(
                wb["Demand_History"],
                {"Date": "date", "Site_ID": "site_id", "Equipment_Type": "equipment_type",
                 "Rental_Demand": "rental_demand"},
                date_cols={"Date"},
                int_cols={"Rental_Demand"},
            ),
        )

        session.commit()

    wb.close()
    return _counts(engine)


def _counts(engine) -> dict:
    tables = [
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
    with Session(engine) as session:
        return {
            name: session.scalar(select(func.count()).select_from(model))
            for name, model in tables
        }


def main():
    from . import config
    from .database import engine

    counts = seed(engine, config.DATASET_PATH)
    print("Seeded database with row counts:")
    for name, count in counts.items():
        print(f"  {name}: {count}")


if __name__ == "__main__":
    main()
