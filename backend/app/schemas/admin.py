from pydantic import BaseModel


class AdminMetricsResponse(BaseModel):
    total_users: int
    active_subscriptions: int
    total_games: int
    total_pools: int
    games_last_24h: int
    latest_results_cached: int
    plan_breakdown: dict[str, int]
