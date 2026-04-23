from typing import List
from pydantic import BaseModel


class StatsResponse(BaseModel):
    contests_analyzed: int
    contests_growth: float
    hot_numbers_count: int
    hot_numbers_change: float
    delayed_numbers_count: int
    delayed_numbers_change: float
    accuracy_rate: float
    accuracy_trend: float


class DashboardStatsResponse(BaseModel):
    stats: StatsResponse
    last_updated: str
