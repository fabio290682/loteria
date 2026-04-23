#!/usr/bin/env python
"""Initialize database tables only."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import Base, engine
import app.models

print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✓ Success! Database tables created.")

# Verify DrawResult table
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"\nTables in database: {tables}")

if "draw_results" in tables:
    print("✓ draw_results table created successfully!")
    columns = inspector.get_columns("draw_results")
    print("\nColumns:")
    for col in columns:
        print(f"  - {col['name']}: {col['type']}")
