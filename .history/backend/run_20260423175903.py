#!/usr/bin/env python
"""Initialize database and run the application."""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import Base, engine
import app.models  # noqa: F401 - Imports all models for metadata

# Create all tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✓ Database tables created successfully!")

# Import and verify DrawResult model
from app.models.draw_result import DrawResult
print(f"✓ DrawResult model loaded: {DrawResult.__tablename__}")

# Start the server
print("\nStarting FastAPI server...")
import uvicorn
uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
