from typing import Any, List
from pydantic import BaseModel, Field


class GenerateGamesRequest(BaseModel):
    lottery_type: str = 'lotofacil'
    total_numbers: int = Field(25, ge=5)
    picks: int = Field(6, ge=5)
    game_count: int = Field(10, ge=1, le=100)
    even_target: int | None = None
    min_sum: int = 1
    max_sum: int = 9999
    avoid_sequences: bool = True
    favor_delayed: bool = True
    favor_frequent: bool = True


class GeneratedGameItem(BaseModel):
    numbers: List[int]
    score: int
    sum: int
    even_count: int


class GenerateGamesResponse(BaseModel):
    lottery_type: str
    total_generated: int
    filters: dict[str, Any]
    games: List[GeneratedGameItem]


class SavedGameResponse(BaseModel):
    id: int
    lottery_type: str
    numbers: List[int]
    score: int
    game_sum: int
    even_count: int
    filters: dict[str, Any]
    source: str
    pool_id: int | None = None

    class Config:
        from_attributes = True
