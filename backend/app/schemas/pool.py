from pydantic import BaseModel, Field


class PoolCreateRequest(BaseModel):
    name: str
    lottery_type: str
    description: str | None = None
    quota_value: float = Field(0, ge=0)


class PoolMemberRequest(BaseModel):
    email: str
    quota_count: int = Field(1, ge=1, le=100)


class PoolResponse(BaseModel):
    id: int
    name: str
    lottery_type: str
    description: str | None
    quota_value: float
    is_active: bool
    owner_id: int
    members_count: int
    games_count: int


class PoolDetailResponse(PoolResponse):
    members: list[dict]
    games: list[dict]
