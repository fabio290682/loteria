from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.user import User
from app.services.claude_analyzer import analyze_and_rank

router = APIRouter(prefix="/ai", tags=["ai"])


class AnalyzeRequest(BaseModel):
    lottery_type: str = "megasena"
    candidates: list[dict]
    hot_numbers: list[int] = []
    delayed_numbers: list[int] = []


@router.post("/analyze")
async def analyze_games(payload: AnalyzeRequest, current_user: User = Depends(get_current_user)):
    if len(payload.candidates) < 2:
        raise HTTPException(status_code=422, detail="Envie pelo menos 2 jogos candidatos.")

    result = analyze_and_rank(
        lottery_type=payload.lottery_type,
        candidates=payload.candidates,
        hot_numbers=payload.hot_numbers,
        delayed_numbers=payload.delayed_numbers,
    )

    if result is None:
        raise HTTPException(
            status_code=503,
            detail="Analise IA indisponivel. Configure ANTHROPIC_API_KEY no servidor.",
        )

    return result
