#!/usr/bin/env sh
set -e

python - <<'PY'
import time
from sqlalchemy import create_engine, text
from app.core.config import get_settings

settings = get_settings()
engine = create_engine(settings.DATABASE_URL, future=True)
for attempt in range(30):
    try:
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
        print('Database connection OK')
        break
    except Exception as exc:
        print(f'Database not ready (attempt {attempt + 1}/30): {exc}')
        time.sleep(2)
else:
    raise SystemExit('Database did not become ready in time')
PY

exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers
