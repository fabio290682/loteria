from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api.admin import router as admin_router
from app.api.ai_analysis import router as ai_router
from app.api.analytics import router as analytics_router
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.exports import router as exports_router
from app.api.games import router as games_router
from app.api.pools import router as pools_router
from app.api.results import router as results_router
from app.api.subscriptions import router as subscriptions_router
from app.core.config import get_settings
from app.db.session import Base, engine
import app.models  # noqa: F401

settings = get_settings()
Base.metadata.create_all(bind=engine)


def ensure_runtime_columns():
    """Apply additive column updates for deployments still relying on create_all."""
    inspector = inspect(engine)
    if 'generated_games' not in set(inspector.get_table_names()):
        return

    existing_columns = {column['name'] for column in inspector.get_columns('generated_games')}
    statements = []

    if 'ai_confidence' not in existing_columns:
        statements.append('ALTER TABLE generated_games ADD COLUMN ai_confidence FLOAT')
    if 'ai_notes' not in existing_columns:
        statements.append('ALTER TABLE generated_games ADD COLUMN ai_notes TEXT')
    if 'ai_provider_votes' not in existing_columns:
        json_type = 'JSONB' if engine.dialect.name == 'postgresql' else 'JSON'
        statements.append(f'ALTER TABLE generated_games ADD COLUMN ai_provider_votes {json_type}')

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


ensure_runtime_columns()

app = FastAPI(title=settings.APP_NAME)
app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])


@app.get('/')
def healthcheck():
    return {'status': 'ok', 'app': settings.APP_NAME, 'version': 'v4'}


@app.get('/healthz')
def healthz():
    return {'status': 'healthy'}


app.include_router(auth_router)
app.include_router(ai_router)
app.include_router(analytics_router)
app.include_router(dashboard_router)
app.include_router(games_router)
app.include_router(results_router)
app.include_router(subscriptions_router)
app.include_router(exports_router)
app.include_router(pools_router)
app.include_router(admin_router)
