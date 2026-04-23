from __future__ import annotations
from sqlalchemy.orm import Session

from app.models.result_cache import ResultCache
from app.services.results_provider import fetch_latest_result


async def sync_latest_for_lottery(db: Session, lottery_type: str) -> dict:
    result = await fetch_latest_result(lottery_type)
    existing = db.query(ResultCache).filter(ResultCache.lottery_type == result['lottery_type'], ResultCache.contest == result['contest']).first()
    if not existing:
        item = ResultCache(
            lottery_type=result['lottery_type'],
            contest=result['contest'],
            draw_date=result.get('draw_date'),
            numbers=result.get('numbers', []),
            payload=result,
            source=result.get('source', 'remote'),
        )
        db.add(item)
        db.commit()
        db.refresh(item)
    return result
