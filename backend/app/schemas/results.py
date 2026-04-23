from datetime import date
from typing import List, Optional

from pydantic import BaseModel


class LotteryResult(BaseModel):
    lottery_type: str
    contest: int
    draw_date: Optional[date] = None
    numbers: List[int]
    next_draw_date: Optional[str] = None
    estimated_prize: Optional[str] = None
    source: str


class LotteryHistoryResponse(BaseModel):
    lottery_type: str
    items: List[LotteryResult]
