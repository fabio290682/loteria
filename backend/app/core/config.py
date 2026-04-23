from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    APP_NAME: str = 'LotoMetrics API'
    APP_ENV: str = 'development'
    SECRET_KEY: str = 'change-me'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = 'sqlite:///./app.db'
    CORS_ORIGINS: List[str] | str = ['http://localhost:5173', 'http://localhost:3000']

    RESULTS_PROVIDER: str = 'caixa'
    CAIXA_RESULTS_URL: str = 'https://servicebus2.caixa.gov.br/portaldeloterias/api'
    LOTERIAS_PUBLIC_URL: str = 'https://loterias.caixa.gov.br/Paginas/default.aspx'

    STRIPE_SECRET_KEY: str = ''
    STRIPE_WEBHOOK_SECRET: str = ''
    STRIPE_PRICE_STARTER: str = ''
    STRIPE_PRICE_PRO: str = ''
    STRIPE_PRICE_PREMIUM: str = ''
    MERCADO_PAGO_ACCESS_TOKEN: str = ''
    PAYMENT_SUCCESS_URL: str = 'http://localhost:5173/billing/success'
    PAYMENT_CANCEL_URL: str = 'http://localhost:5173/billing/cancel'

    ENABLE_RESULT_JOBS: bool = True
    RESULT_SYNC_LOTTERIES: List[str] | str = ['megasena', 'lotofacil', 'quina']
    ENABLE_AI_ANALYSIS: bool = False
    AI_ANALYSIS_PROVIDER: str = 'n8n'
    N8N_ANALYSIS_WEBHOOK_URL: str = ''
    N8N_ANALYSIS_TIMEOUT_SECONDS: int = 20
    AI_MIN_CONFIDENCE: float = 0.55

    @field_validator('CORS_ORIGINS', 'RESULT_SYNC_LOTTERIES', mode='before')
    @classmethod
    def parse_list_values(cls, value):
        if isinstance(value, str):
            return [item.strip() for item in value.split(',') if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
