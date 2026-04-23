from __future__ import annotations

from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.generated_game import GeneratedGame
from app.models.pool import Pool
from app.models.user import User
from app.services.payment_service import PLANS


def get_plan_limits(plan: str) -> dict:
    return PLANS.get(plan, PLANS['starter'])['limits']


def enforce_generation_limit(db: Session, user: User, requested_count: int):
    limits = get_plan_limits(user.plan)
    max_batch = limits.get('max_games_per_batch', 0)
    if max_batch and requested_count > max_batch:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f'Plano {user.plan} permite até {max_batch} jogos por geração.')

    daily_limit = limits.get('daily_generations', 0)
    if daily_limit:
        since = datetime.now(timezone.utc) - timedelta(days=1)
        count = db.query(GeneratedGame).filter(GeneratedGame.user_id == user.id, GeneratedGame.created_at >= since).count()
        if count >= daily_limit:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f'Limite diário do plano {user.plan} atingido.')


def enforce_pool_limit(db: Session, user: User):
    limits = get_plan_limits(user.plan)
    max_pools = limits.get('max_pools', 0)
    if max_pools:
        current = db.query(Pool).filter(Pool.owner_id == user.id).count()
        if current >= max_pools:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f'Plano {user.plan} permite até {max_pools} bolões.')
