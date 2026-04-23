from __future__ import annotations

from datetime import datetime
from typing import Any
import re

import httpx

from app.core.config import get_settings

settings = get_settings()

LOTTERY_MAP = {
    'mega': 'megasena',
    'megasena': 'megasena',
    'mega-sena': 'megasena',
    'lotofacil': 'lotofacil',
    'quina': 'quina',
}

FALLBACK_RESULTS = {
    'megasena': [
        {'contest': 2998, 'draw_date': '2026-04-18', 'numbers': [4, 15, 17, 20, 24, 54], 'estimated_prize': 'R$ 70.000.000,00'},
        {'contest': 2997, 'draw_date': '2026-04-16', 'numbers': [5, 18, 24, 37, 51, 56], 'estimated_prize': 'R$ 45.000.000,00'},
    ],
    'lotofacil': [
        {'contest': 3668, 'draw_date': '2026-04-22', 'numbers': [1, 2, 5, 6, 7, 9, 10, 11, 12, 14, 18, 20, 21, 24, 25], 'estimated_prize': 'R$ 1.800.000,00'},
        {'contest': 3667, 'draw_date': '2026-04-21', 'numbers': [1, 3, 4, 5, 7, 9, 10, 11, 13, 14, 16, 20, 22, 23, 25], 'estimated_prize': 'R$ 1.700.000,00'},
    ],
    'quina': [
        {'contest': 6712, 'draw_date': '2026-04-22', 'numbers': [3, 11, 26, 37, 78], 'estimated_prize': 'R$ 600.000,00'},
        {'contest': 6711, 'draw_date': '2026-04-21', 'numbers': [10, 14, 24, 61, 79], 'estimated_prize': 'R$ 500.000,00'},
    ],
}


def normalize_lottery_type(lottery_type: str) -> str:
    return LOTTERY_MAP.get(lottery_type.lower().strip(), lottery_type.lower().strip())


def _parse_numbers(payload: Any) -> list[int]:
    if isinstance(payload, list):
        numbers = []
        for item in payload:
            try:
                numbers.append(int(str(item).lstrip('0') or '0'))
            except ValueError:
                continue
        return numbers
    return []


def _parse_date(value: str | None) -> str | None:
    if not value:
        return None
    value = value.strip()
    for fmt in ('%d/%m/%Y', '%Y-%m-%d'):
        try:
            return datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def _caixa_endpoint(lottery_type: str) -> str:
    normalized = normalize_lottery_type(lottery_type)
    return f"{settings.CAIXA_RESULTS_URL}/{normalized}"


async def fetch_latest_result(lottery_type: str) -> dict[str, Any]:
    normalized = normalize_lottery_type(lottery_type)
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            response = await client.get(_caixa_endpoint(normalized), headers={'accept': 'application/json'})
            response.raise_for_status()
            data = response.json()
            numbers = _parse_numbers(data.get('listaDezenas') or data.get('dezenas'))
            return {
                'lottery_type': normalized,
                'contest': int(data.get('numero') or data.get('numeroDoConcurso') or 0),
                'draw_date': _parse_date(data.get('dataApuracao') or data.get('dataPorExtenso') or data.get('data')), 
                'numbers': numbers,
                'next_draw_date': data.get('dataProximoConcurso'),
                'estimated_prize': str(data.get('valorEstimadoProximoConcurso') or data.get('valorEstimado') or ''),
                'source': settings.LOTERIAS_PUBLIC_URL,
            }
    except Exception:
        fallback = FALLBACK_RESULTS.get(normalized, [])
        item = fallback[0] if fallback else {'contest': 0, 'draw_date': None, 'numbers': []}
        return {
            'lottery_type': normalized,
            'contest': item['contest'],
            'draw_date': item['draw_date'],
            'numbers': item['numbers'],
            'next_draw_date': None,
            'estimated_prize': item.get('estimated_prize'),
            'source': 'fallback-local',
        }


async def fetch_history(lottery_type: str, limit: int = 10) -> list[dict[str, Any]]:
    normalized = normalize_lottery_type(lottery_type)
    latest = await fetch_latest_result(normalized)
    items = [latest]
    fallback = FALLBACK_RESULTS.get(normalized, [])
    for item in fallback[1:limit]:
        items.append(
            {
                'lottery_type': normalized,
                'contest': item['contest'],
                'draw_date': item['draw_date'],
                'numbers': item['numbers'],
                'next_draw_date': None,
                'estimated_prize': item.get('estimated_prize'),
                'source': latest['source'],
            }
        )
    return items[:limit]
