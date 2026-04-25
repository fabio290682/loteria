"""
Schemas Pydantic para os endpoints de ML.
"""
from __future__ import annotations
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator


# ── Inputs (endpoints raw que recebem draws no body) ──────────────────────────

class DrawInput(BaseModel):
    """Lista de sorteios históricos para treinar a análise."""
    draws: List[List[int]] = Field(
        ...,
        description="Lista de sorteios históricos.",
        examples=[[[4, 5, 30, 33, 41, 52], [3, 17, 28, 37, 46, 56]]],
    )

    @field_validator("draws")
    @classmethod
    def validate_draws(cls, v):
        if not v:
            raise ValueError("A lista de sorteios não pode estar vazia.")
        game_size = len(v[0])
        for draw in v:
            if len(draw) != game_size:
                raise ValueError("Todos os sorteios devem ter o mesmo número de dezenas.")
            if len(set(draw)) != game_size:
                raise ValueError("Números do sorteio devem ser únicos.")
        return v


class ScoreGameRequest(BaseModel):
    draws: List[List[int]] = Field(..., description="Histórico de sorteios.")
    game:  List[int]       = Field(..., description="Jogo a ser pontuado.")

    @field_validator("game")
    @classmethod
    def validate_game(cls, v):
        if len(set(v)) != len(v):
            raise ValueError("Os números devem ser únicos.")
        if any(n < 1 for n in v):
            raise ValueError("Números devem ser ≥ 1.")
        return v


class SuggestGamesRequest(BaseModel):
    draws:    List[List[int]]                                = Field(..., description="Histórico de sorteios.")
    n_games:  int                                            = Field(5, ge=1, le=20)
    strategy: Literal["balanced", "hot", "cold", "overdue"] = Field("balanced")


# ── Inputs (endpoints com DB automático) ──────────────────────────────────────

class ScoreGameDBRequest(BaseModel):
    """Pontua um jogo usando dados históricos do banco."""
    game: List[int] = Field(..., description="Dezenas do jogo a ser pontuado.")

    @field_validator("game")
    @classmethod
    def validate_game(cls, v):
        if len(set(v)) != len(v):
            raise ValueError("Os números devem ser únicos.")
        if any(n < 1 for n in v):
            raise ValueError("Números devem ser ≥ 1.")
        return v


# ── Outputs ───────────────────────────────────────────────────────────────────

class NumberStat(BaseModel):
    number:    int
    frequency: int
    score:     float


class OverdueStat(BaseModel):
    number:    int
    draws_ago: int
    frequency: int
    score:     float


class PairStat(BaseModel):
    pair:  List[int]
    count: int
    pct:   float


class GameScore(BaseModel):
    game:              List[int]
    composite_score:   float
    avg_frequency:     float
    avg_cooccurrence:  float
    features:          Dict
    rating:            str


class HistoricalProfile(BaseModel):
    total_draws:           int
    sum_stats:             Dict
    odd_even_avg:          Dict
    low_high_avg:          Dict
    avg_span:              float
    most_common_sum_range: Dict


class AnalysisResponse(BaseModel):
    lottery:         Optional[str] = None
    total_draws:     int
    hot_numbers:     List[NumberStat]
    cold_numbers:    List[NumberStat]
    overdue_numbers: List[OverdueStat]
    top_pairs:       List[PairStat]
    profile:         HistoricalProfile


class NumberScoreItem(BaseModel):
    number:    int
    score:     float
    frequency: int
    gap:       int
