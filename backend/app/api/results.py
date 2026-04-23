from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user
from app.db.session import get_db
from app.models.result_cache import ResultCache
from app.schemas.results import LatestResultResponse, ResultHistoryResponse
from app.services.result_sync import sync_latest_for_lottery
from app.services.results_provider import fetch_history, fetch_latest_result

router = APIRouter(prefix='/results', tags=['results'])


@router.get('/latest/{lottery_type}', response_model=LatestResultResponse)
async def latest_result(lottery_type: str):
    return await fetch_latest_result(lottery_type)


@router.get('/history/{lottery_type}', response_model=ResultHistoryResponse)
async def result_history(lottery_type: str, limit: int = Query(default=10, ge=1, le=50)):
    items = await fetch_history(lottery_type, limit=limit)
    return {'lottery_type': lottery_type, 'items': items}


@router.post('/sync/{lottery_type}')
async def sync_result(lottery_type: str, db: Session = Depends(get_db), admin=Depends(get_admin_user)):
    result = await sync_latest_for_lottery(db, lottery_type)
    return {'status': 'synced', 'item': result}


@router.get('/cache/{lottery_type}')
def cached_results(lottery_type: str, db: Session = Depends(get_db)):
    items = db.query(ResultCache).filter(ResultCache.lottery_type == lottery_type).order_by(ResultCache.id.desc()).limit(20).all()
    return [{'contest': i.contest, 'draw_date': i.draw_date, 'numbers': i.numbers, 'source': i.source} for i in items]
