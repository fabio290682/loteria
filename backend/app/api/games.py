from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.generated_game import GeneratedGame
from app.models.user import User
from app.schemas.game import GenerateGamesRequest, GenerateGamesResponse, SavedGameResponse
from app.services.game_engine import generate_games
from app.services.plan_guard import enforce_generation_limit

router = APIRouter(prefix='/games', tags=['games'])


@router.post('/generate', response_model=GenerateGamesResponse)
def generate(payload: GenerateGamesRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    enforce_generation_limit(db, user, payload.game_count)
    filters = payload.model_dump()
    games = generate_games(filters)
    return {'lottery_type': payload.lottery_type, 'total_generated': len(games), 'filters': filters, 'games': games}


@router.post('/generate-and-save', response_model=list[SavedGameResponse])
def generate_and_save(payload: GenerateGamesRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    enforce_generation_limit(db, user, payload.game_count)
    filters = payload.model_dump()
    generated = generate_games(filters)
    records = []
    for game in generated:
        ai_confidence = game.get('ai_confidence')
        record = GeneratedGame(
            lottery_type=payload.lottery_type,
            numbers=game['numbers'],
            score=game['score'],
            game_sum=game['sum'],
            even_count=game['even_count'],
            filters=filters,
            user_id=user.id,
            source='ai-ranked' if ai_confidence is not None else 'manual',
            ai_confidence=ai_confidence,
            ai_notes=game.get('ai_notes'),
            ai_provider_votes=game.get('ai_provider_votes'),
        )
        db.add(record)
        records.append(record)
    db.commit()
    for item in records:
        db.refresh(item)
    return records


@router.get('/history', response_model=list[SavedGameResponse])
def history(db: Session = Depends(get_db), user: User = Depends(get_current_user), lottery_type: str | None = Query(default=None)):
    query = db.query(GeneratedGame).filter(GeneratedGame.user_id == user.id)
    if lottery_type:
        query = query.filter(GeneratedGame.lottery_type == lottery_type)
    return query.order_by(GeneratedGame.id.desc()).all()
