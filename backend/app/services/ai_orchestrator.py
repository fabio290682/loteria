from __future__ import annotations

from typing import Any

import httpx

from app.core.config import get_settings

settings = get_settings()


def _build_payload(filters: dict[str, Any], candidates: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        'lottery_type': filters.get('lottery_type'),
        'filters': filters,
        'candidates': candidates,
        'instructions': {
            'goal': 'Rank lottery candidates using statistical consistency and multi-model consensus.',
            'providers': ['chatgpt', 'gemini'],
            'expected_output': {
                'recommended_order': ['candidate indexes sorted from best to worst'],
                'confidence': 'number between 0 and 1',
                'notes': 'short explanation for ranking',
                'provider_votes': 'optional provider-specific reasoning',
            },
        },
    }


def rerank_candidates_with_ai(filters: dict[str, Any], candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not settings.ENABLE_AI_ANALYSIS:
        return candidates
    if settings.AI_ANALYSIS_PROVIDER != 'n8n':
        return candidates
    if not settings.N8N_ANALYSIS_WEBHOOK_URL:
        return candidates
    if len(candidates) < 2:
        return candidates

    payload = _build_payload(filters, candidates)

    try:
        with httpx.Client(timeout=settings.N8N_ANALYSIS_TIMEOUT_SECONDS) as client:
            response = client.post(settings.N8N_ANALYSIS_WEBHOOK_URL, json=payload)
            response.raise_for_status()
            data = response.json()
    except Exception:
        return candidates

    ordered_indexes = data.get('recommended_order') or []
    confidence = float(data.get('confidence') or 0)
    notes = str(data.get('notes') or '').strip()
    provider_votes = data.get('provider_votes') or {}

    if confidence < settings.AI_MIN_CONFIDENCE:
        return candidates

    ranked: list[dict[str, Any]] = []
    seen: set[int] = set()

    for raw_index in ordered_indexes:
        try:
            index = int(raw_index)
        except (TypeError, ValueError):
            continue
        if 0 <= index < len(candidates) and index not in seen:
            item = dict(candidates[index])
            item['ai_confidence'] = confidence
            item['ai_notes'] = notes
            item['ai_provider_votes'] = provider_votes
            ranked.append(item)
            seen.add(index)

    for index, candidate in enumerate(candidates):
        if index in seen:
            continue
        item = dict(candidate)
        item['ai_confidence'] = confidence
        item['ai_notes'] = notes
        item['ai_provider_votes'] = provider_votes
        ranked.append(item)

    return ranked
