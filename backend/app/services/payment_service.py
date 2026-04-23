from __future__ import annotations
from uuid import uuid4
from app.core.config import get_settings

settings = get_settings()

PLANS = {
    'starter': {
        'slug': 'starter',
        'name': 'Starter',
        'price_brl_monthly': 29.0,
        'features': ['10 jogos por geração', 'Até 50 jogos/dia', '1 bolão'],
        'limits': {'daily_generations': 50, 'max_games_per_batch': 10, 'max_pools': 1, 'priority_support': False},
    },
    'pro': {
        'slug': 'pro',
        'name': 'Pro',
        'price_brl_monthly': 79.0,
        'features': ['25 jogos por geração', 'Até 300 jogos/dia', '5 bolões', 'Exportações completas'],
        'limits': {'daily_generations': 300, 'max_games_per_batch': 25, 'max_pools': 5, 'priority_support': False},
    },
    'premium': {
        'slug': 'premium',
        'name': 'Premium',
        'price_brl_monthly': 149.0,
        'features': ['100 jogos por geração', 'Uso intenso', 'Bolões ilimitados', 'Painel admin-ready'],
        'limits': {'daily_generations': 5000, 'max_games_per_batch': 100, 'max_pools': 9999, 'priority_support': True},
    },
}


def list_plans() -> list[dict]:
    return list(PLANS.values())


def build_checkout(plan: str, provider: str = 'internal-demo') -> dict:
    if plan not in PLANS:
        raise ValueError('Plano inválido')
    ref = f'{provider}-{plan}-{uuid4().hex[:12]}'
    if provider == 'stripe' and settings.STRIPE_SECRET_KEY:
        status = 'configured'
    elif provider == 'mercado-pago' and settings.MERCADO_PAGO_ACCESS_TOKEN:
        status = 'configured'
    else:
        provider = 'internal-demo'
        status = 'demo'
    return {
        'provider': provider,
        'plan': plan,
        'status': status,
        'checkout_url': f'{settings.PAYMENT_SUCCESS_URL}?provider={provider}&plan={plan}&ref={ref}',
        'reference': ref,
    }
