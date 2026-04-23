from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.analytics import (
    DashboardAnalyticsResponse,
    GenerateAnalyticsGamesRequest,
    GenerateAnalyticsGamesResponse,
    LotteryType,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix='/analytics', tags=['analytics'])


@router.get('/dashboard', response_model=DashboardAnalyticsResponse)
async def get_dashboard(
    lottery: LotteryType = Query(default='megasena'),
    range: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
):
    try:
        service = AnalyticsService(db=db)
        return await service.get_dashboard(lottery=lottery, range_size=range)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post('/generate', response_model=GenerateAnalyticsGamesResponse)
async def generate_analytics_games(payload: GenerateAnalyticsGamesRequest, db: Session = Depends(get_db)):
    try:
        service = AnalyticsService(db=db)
        jogos = await service.generate_games(
            lottery=payload.lottery,
            amount=payload.amount,
            range_size=payload.filters.range,
            include_hot=payload.filters.includeHot,
            include_delayed=payload.filters.includeDelayed,
        )
        if payload.filters.balanced:
            jogos = [sorted(jogo, key=lambda x: int(x)) for jogo in jogos]
        return GenerateAnalyticsGamesResponse(jogos=jogos)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
