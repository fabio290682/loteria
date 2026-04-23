from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user
from app.db.session import get_db
from app.models.generated_game import GeneratedGame
from app.models.pool import Pool
from app.models.result_cache import ResultCache
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.admin import AdminMetricsResponse

router = APIRouter(prefix='/admin', tags=['admin'])


@router.get('/metrics', response_model=AdminMetricsResponse)
def metrics(db: Session = Depends(get_db), admin=Depends(get_admin_user)):
    since = datetime.now(timezone.utc) - timedelta(days=1)
    plan_rows = db.query(User.plan, func.count(User.id)).group_by(User.plan).all()
    return AdminMetricsResponse(
        total_users=db.query(User).count(),
        active_subscriptions=db.query(Subscription).filter(Subscription.status == 'active').count(),
        total_games=db.query(GeneratedGame).count(),
        total_pools=db.query(Pool).count(),
        games_last_24h=db.query(GeneratedGame).filter(GeneratedGame.created_at >= since).count(),
        latest_results_cached=db.query(ResultCache).count(),
        plan_breakdown={plan: count for plan, count in plan_rows},
    )
