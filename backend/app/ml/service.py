"""
Serviço ML com integração ao banco de dados.
Busca histórico de ResultCache e cria LotteryAnalyzer por tipo de loteria.
"""
from __future__ import annotations

import time
from typing import Dict, List, Literal, Optional, Tuple

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.result_cache import ResultCache
from .analyzer import LotteryAnalyzer

LotteryType = Literal["megasena", "lotofacil", "quina"]

LOTTERY_CONFIG: Dict[str, Dict] = {
    "megasena":  {"max_number": 60, "game_size": 6,  "name": "Mega-Sena"},
    "lotofacil": {"max_number": 25, "game_size": 15, "name": "Lotofácil"},
    "quina":     {"max_number": 80, "game_size": 5,  "name": "Quina"},
}

# Cache em memória: (lottery, draws_count) → (analyzer, timestamp)
_CACHE: Dict[str, Tuple[LotteryAnalyzer, float]] = {}
_CACHE_TTL = 300  # 5 minutos


def _normalize_numbers(raw) -> Optional[List[int]]:
    """Converte representações variadas de dezenas para List[int]."""
    if isinstance(raw, list):
        try:
            return [int(n) for n in raw]
        except (TypeError, ValueError):
            return None
    if isinstance(raw, str):
        cleaned = raw.replace("[", "").replace("]", "").replace('"', "").replace("'", "")
        parts = [p.strip() for p in cleaned.split(",") if p.strip()]
        try:
            return [int(p) for p in parts]
        except ValueError:
            return None
    return None


def _fetch_draws_from_db(db: Session, lottery: LotteryType, limit: int = 500) -> List[List[int]]:
    """Busca sorteios históricos do ResultCache, ordenados do mais antigo ao mais recente."""
    stmt = (
        select(ResultCache)
        .where(ResultCache.lottery_type == lottery)
        .order_by(desc(ResultCache.contest))
        .limit(limit)
    )
    rows = db.execute(stmt).scalars().all()

    draws: List[List[int]] = []
    for row in reversed(rows):  # mais antigo primeiro para recency funcionar corretamente
        nums = _normalize_numbers(row.numbers)
        if nums and len(nums) == LOTTERY_CONFIG[lottery]["game_size"]:
            draws.append(nums)

    return draws


def get_analyzer(db: Session, lottery: LotteryType, limit: int = 500) -> LotteryAnalyzer:
    """
    Retorna um LotteryAnalyzer para a loteria especificada.
    Usa cache em memória com TTL de 5 minutos.
    Raises ValueError se não houver dados suficientes no banco.
    """
    cache_key = f"{lottery}:{limit}"
    cached = _CACHE.get(cache_key)
    if cached:
        analyzer, ts = cached
        if time.time() - ts < _CACHE_TTL:
            return analyzer

    draws = _fetch_draws_from_db(db, lottery, limit)
    if not draws:
        raise ValueError(
            f"Sem dados históricos para '{lottery}' no banco. "
            "Execute a sincronização de resultados primeiro."
        )

    cfg      = LOTTERY_CONFIG[lottery]
    analyzer = LotteryAnalyzer(draws, max_number=cfg["max_number"], game_size=cfg["game_size"])
    _CACHE[cache_key] = (analyzer, time.time())
    return analyzer


def invalidate_cache(lottery: Optional[LotteryType] = None) -> None:
    """Remove entradas do cache (toda a loteria ou todas)."""
    if lottery:
        keys = [k for k in _CACHE if k.startswith(f"{lottery}:")]
        for k in keys:
            _CACHE.pop(k, None)
    else:
        _CACHE.clear()
