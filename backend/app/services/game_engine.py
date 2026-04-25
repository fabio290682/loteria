from __future__ import annotations

import random
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.services.ai_orchestrator import rerank_candidates_with_ai

# Dados de fallback usados quando não há histórico no banco
_FALLBACK_DRAWS = [
    [1, 4, 8, 12, 19, 25],
    [3, 7, 10, 14, 21, 24],
    [2, 6, 11, 16, 20, 23],
    [5, 9, 13, 18, 22, 25],
    [1, 7, 11, 15, 19, 24],
    [4, 8, 10, 14, 20, 25],
    [2, 5, 9, 13, 18, 21],
    [3, 6, 12, 16, 22, 24],
    [1, 4, 10, 17, 20, 23],
    [2, 7, 11, 15, 19, 25],
    [3, 8, 12, 14, 21, 24],
    [5, 6, 9, 16, 18, 22],
]


def _load_draws(db: Optional[Session], lottery_type: str, total_numbers: int) -> list[list[int]]:
    """Carrega histórico do banco; usa fallback se indisponível."""
    if db is None:
        return _FALLBACK_DRAWS

    try:
        from app.ml.service import _fetch_draws_from_db
        draws = _fetch_draws_from_db(db, lottery_type, limit=300)  # type: ignore[arg-type]
        return draws if draws else _FALLBACK_DRAWS
    except Exception:
        return _FALLBACK_DRAWS


def range_list(start: int, end: int) -> list[int]:
    return list(range(start, end + 1))


def count_frequency(draws: list[list[int]], max_number: int) -> dict[int, int]:
    freq = {n: 0 for n in range_list(1, max_number)}
    for draw in draws:
        for n in draw:
            if n <= max_number:
                freq[n] += 1
    return freq


def calculate_delay(draws: list[list[int]], max_number: int) -> dict[int, int]:
    delays: dict[int, int] = {}
    reversed_draws = list(reversed(draws))
    for n in range_list(1, max_number):
        idx = next((i for i, draw in enumerate(reversed_draws) if n in draw), len(draws))
        delays[n] = idx
    return delays


def total_sum(numbers: list[int]) -> int:
    return sum(numbers)


def count_even(numbers: list[int]) -> int:
    return sum(1 for n in numbers if n % 2 == 0)


def has_long_sequence(numbers: list[int], max_allowed: int = 2) -> bool:
    sorted_numbers = sorted(numbers)
    current = 1
    for i in range(1, len(sorted_numbers)):
        if sorted_numbers[i] == sorted_numbers[i - 1] + 1:
            current += 1
            if current > max_allowed:
                return True
        else:
            current = 1
    return False


def score_game(game: list[int], freq: dict[int, int], delays: dict[int, int]) -> int:
    frequency_score  = sum(freq.get(n, 0) for n in game)
    delay_score      = sum(delays.get(n, 0) for n in game)
    balance_penalty  = abs(count_even(game) - len(game) / 2) * 2
    sequence_penalty = 10 if has_long_sequence(game, 2) else 0
    return int(frequency_score + delay_score - balance_penalty - sequence_penalty)


def generate_games(
    filters: dict[str, Any],
    db: Optional[Session] = None,
) -> list[dict[str, Any]]:
    total_numbers   = filters['total_numbers']
    picks           = filters['picks']
    game_count      = filters['game_count']
    even_target     = filters.get('even_target')
    min_sum         = filters['min_sum']
    max_sum         = filters['max_sum']
    avoid_sequences = filters['avoid_sequences']
    favor_delayed   = filters['favor_delayed']
    favor_frequent  = filters['favor_frequent']
    lottery_type    = filters.get('lottery_type', 'megasena')

    universe = range_list(1, total_numbers)
    draws    = _load_draws(db, lottery_type, total_numbers)
    freq     = count_frequency(draws, total_numbers)
    delays   = calculate_delay(draws, total_numbers)

    weighted_pool: list[int] = []
    for n in universe:
        weight = 1
        if favor_frequent:
            weight += max(0, freq[n])
        if favor_delayed:
            weight += max(0, delays[n])
        weighted_pool.extend([n] * min(weight, 12))

    unique_games: set[str] = set()
    results: list[dict[str, Any]] = []
    attempts = 0

    while len(results) < game_count and attempts < 8000:
        attempts += 1
        draft: list[int] = []
        pool = weighted_pool[:]
        random.shuffle(pool)

        for n in pool:
            if n not in draft:
                draft.append(n)
            if len(draft) == picks:
                break

        game      = sorted(draft)
        game_sum  = total_sum(game)
        even_count = count_even(game)

        if len(game) != picks:
            continue
        if even_target is not None and even_count != even_target:
            continue
        if game_sum < min_sum or game_sum > max_sum:
            continue
        if avoid_sequences and has_long_sequence(game, 2):
            continue

        key = '-'.join(map(str, game))
        if key not in unique_games:
            unique_games.add(key)
            results.append(
                {
                    'numbers':    game,
                    'score':      score_game(game, freq, delays),
                    'sum':        game_sum,
                    'even_count': even_count,
                }
            )

    results.sort(key=lambda item: item['score'], reverse=True)
    return rerank_candidates_with_ai(filters, results)
