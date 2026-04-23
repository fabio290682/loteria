from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.generated_game import GeneratedGame
from app.models.user import User
from app.services.export_service import games_to_csv_rows, single_game_pdf

router = APIRouter(prefix='/exports', tags=['exports'])


@router.get('/history.csv')
def export_history_csv(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    records = (
        db.query(GeneratedGame)
        .filter(GeneratedGame.user_id == user.id)
        .order_by(GeneratedGame.id.desc())
        .all()
    )
    payload = games_to_csv_rows(records)
    return Response(
        content=payload,
        media_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename=historico-jogos.csv'},
    )


@router.get('/game/{game_id}.pdf')
def export_game_pdf(game_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    record = (
        db.query(GeneratedGame)
        .filter(GeneratedGame.id == game_id, GeneratedGame.user_id == user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail='Jogo não encontrado')
    payload = single_game_pdf(record)
    return Response(
        content=payload,
        media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename=jogo-{game_id}.pdf'},
    )
