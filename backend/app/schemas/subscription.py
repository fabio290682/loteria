from pydantic import BaseModel


class PlanResponse(BaseModel):
    slug: str
    name: str
    price_brl_monthly: float
    features: list[str]
    limits: dict[str, int | bool]


class CheckoutRequest(BaseModel):
    plan: str
    provider: str = 'internal-demo'


class CheckoutResponse(BaseModel):
    provider: str
    plan: str
    status: str
    checkout_url: str
    reference: str


class SubscriptionResponse(BaseModel):
    id: int
    provider: str
    plan: str
    status: str
    checkout_reference: str | None = None
    checkout_url: str | None = None

    class Config:
        from_attributes = True
