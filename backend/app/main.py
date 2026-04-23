from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
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

app = FastAPI(title=settings.APP_NAME)
app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])


@app.get('/')
def healthcheck():
    return {'status': 'ok', 'app': settings.APP_NAME, 'version': 'v4'}


@app.get('/healthz')
def healthz():
    return {'status': 'healthy'}


app.include_router(auth_router)
app.include_router(games_router)
app.include_router(results_router)
app.include_router(subscriptions_router)
app.include_router(exports_router)
app.include_router(pools_router)
app.include_router(admin_router)
