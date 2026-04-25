"""
Router FastAPI para análise ML de loterias.

Dois conjuntos de endpoints:
  /ml/{lottery}/...  → usam dados históricos do banco automaticamente
  /ml/raw/...        → recebem os sorteios no corpo da requisição
"""
from __future__ import annotations

from typing import List, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from .analyzer import LotteryAnalyzer
from .service  import LOTTERY_CONFIG, get_analyzer
from .schemas  import (
    AnalysisResponse,
    DrawInput,
    GameScore,
    NumberScoreItem,
    ScoreGameDBRequest,
    ScoreGameRequest,
    SuggestGamesRequest,
)

router = APIRouter(prefix="/ml", tags=["ML – Análise de Loterias"])

LotteryPath = Literal["megasena", "lotofacil", "quina"]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_raw_analyzer(draws, lottery: str = "megasena") -> LotteryAnalyzer:
    cfg = LOTTERY_CONFIG.get(lottery, LOTTERY_CONFIG["megasena"])
    try:
        return LotteryAnalyzer(draws, max_number=cfg["max_number"], game_size=cfg["game_size"])
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


def _get_db_analyzer(db: Session, lottery: str) -> LotteryAnalyzer:
    try:
        return get_analyzer(db, lottery)  # type: ignore[arg-type]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# Endpoints com banco de dados (sem enviar sorteios no body)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/{lottery}/analyze",
    response_model=AnalysisResponse,
    summary="Análise completa (dados do banco)",
    description=(
        "Busca o histórico de sorteios do banco e retorna números quentes/frios, "
        "ausentes, pares frequentes e perfil estatístico."
    ),
)
def db_analyze(
    lottery: LotteryPath,
    limit: int = Query(500, ge=10, le=2000, description="Quantidade de sorteios a analisar"),
    db: Session = Depends(get_db),
):
    az = _get_db_analyzer(db, lottery)
    return {
        "lottery":         lottery,
        "total_draws":     az.n_draws,
        "hot_numbers":     az.hot_numbers(),
        "cold_numbers":    az.cold_numbers(),
        "overdue_numbers": az.overdue_numbers(),
        "top_pairs":       az.top_pairs(),
        "profile":         az.historical_profile(),
    }


@router.get(
    "/{lottery}/suggest",
    response_model=List[GameScore],
    summary="Sugestão de jogos (dados do banco)",
    description="Gera jogos sugeridos com base nos padrões históricos armazenados no banco.",
)
def db_suggest(
    lottery: LotteryPath,
    n_games:  int = Query(5, ge=1, le=20),
    strategy: Literal["balanced", "hot", "cold", "overdue"] = Query("balanced"),
    db: Session = Depends(get_db),
):
    az = _get_db_analyzer(db, lottery)
    return az.suggest_games(n_games=n_games, strategy=strategy)


@router.post(
    "/{lottery}/score",
    response_model=GameScore,
    summary="Pontua um jogo (dados do banco)",
    description="Avalia o quanto um jogo se alinha com os padrões históricos do banco.",
)
def db_score(
    lottery: LotteryPath,
    body: ScoreGameDBRequest,
    db: Session = Depends(get_db),
):
    az = _get_db_analyzer(db, lottery)
    try:
        return az.score_game(body.game)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get(
    "/{lottery}/hot",
    summary="Números quentes (dados do banco)",
)
def db_hot(
    lottery: LotteryPath,
    top: int = Query(15, ge=1, le=80),
    db: Session = Depends(get_db),
):
    return _get_db_analyzer(db, lottery).hot_numbers(top=top)


@router.get(
    "/{lottery}/cold",
    summary="Números frios (dados do banco)",
)
def db_cold(
    lottery: LotteryPath,
    top: int = Query(15, ge=1, le=80),
    db: Session = Depends(get_db),
):
    return _get_db_analyzer(db, lottery).cold_numbers(top=top)


@router.get(
    "/{lottery}/overdue",
    summary="Números ausentes (dados do banco)",
)
def db_overdue(
    lottery: LotteryPath,
    top: int = Query(15, ge=1, le=80),
    db: Session = Depends(get_db),
):
    return _get_db_analyzer(db, lottery).overdue_numbers(top=top)


@router.get(
    "/{lottery}/pairs",
    summary="Pares mais frequentes (dados do banco)",
)
def db_pairs(
    lottery: LotteryPath,
    top: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return _get_db_analyzer(db, lottery).top_pairs(top=top)


@router.get(
    "/{lottery}/scores",
    response_model=List[NumberScoreItem],
    summary="Score composto de todos os números (dados do banco)",
)
def db_scores(
    lottery: LotteryPath,
    db: Session = Depends(get_db),
):
    return _get_db_analyzer(db, lottery).number_scores()


# ═══════════════════════════════════════════════════════════════════════════════
# Endpoints raw (sorteios enviados no corpo da requisição)
# ═══════════════════════════════════════════════════════════════════════════════

_raw = APIRouter(prefix="/raw", tags=["ML – Raw (sorteios no body)"])


@_raw.post(
    "/analyze",
    response_model=AnalysisResponse,
    summary="Análise completa (sorteios no body)",
)
def raw_analyze(body: DrawInput, lottery: LotteryPath = Query("megasena")):
    az = _build_raw_analyzer(body.draws, lottery)
    return {
        "total_draws":     az.n_draws,
        "hot_numbers":     az.hot_numbers(),
        "cold_numbers":    az.cold_numbers(),
        "overdue_numbers": az.overdue_numbers(),
        "top_pairs":       az.top_pairs(),
        "profile":         az.historical_profile(),
    }


@_raw.post(
    "/score",
    response_model=GameScore,
    summary="Pontua um jogo (sorteios no body)",
)
def raw_score(body: ScoreGameRequest, lottery: LotteryPath = Query("megasena")):
    az = _build_raw_analyzer(body.draws, lottery)
    try:
        return az.score_game(body.game)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@_raw.post(
    "/suggest",
    response_model=List[GameScore],
    summary="Sugestão de jogos (sorteios no body)",
)
def raw_suggest(body: SuggestGamesRequest, lottery: LotteryPath = Query("megasena")):
    az = _build_raw_analyzer(body.draws, lottery)
    return az.suggest_games(n_games=body.n_games, strategy=body.strategy)


router.include_router(_raw)
