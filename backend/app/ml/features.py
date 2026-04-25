"""
Feature engineering para análise de padrões de loterias.
Suporta Megasena (60/6), Lotofácil (25/15) e Quina (80/5).
"""
from __future__ import annotations
from typing import List, Dict
import numpy as np


# Constantes legadas para compatibilidade
MEGASENA_RANGE = range(1, 61)
GAME_SIZE      = 6


def number_range(max_number: int) -> range:
    return range(1, max_number + 1)


def extract_draw_features(draw: List[int], game_size: int = 6, max_number: int = 60) -> Dict:
    """Extrai features estatísticas de um único sorteio."""
    s = sorted(draw)
    total  = sum(s)
    odd    = sum(1 for n in s if n % 2 != 0)
    even   = game_size - odd
    half   = max_number // 2
    low    = sum(1 for n in s if n <= half)
    high   = game_size - low
    gaps   = [s[i+1] - s[i] for i in range(len(s)-1)]
    # Décadas adaptadas ao universo da loteria
    decade_size = max(10, max_number // 6)
    n_decades   = max_number // decade_size + 1
    decades = {
        d: sum(1 for n in s if (d - 1) * decade_size < n <= d * decade_size)
        for d in range(1, n_decades + 1)
    }
    return {
        "numbers":  s,
        "sum":      total,
        "mean":     round(total / game_size, 2),
        "odd":      odd,
        "even":     even,
        "low":      low,
        "high":     high,
        "min_gap":  min(gaps) if gaps else 0,
        "max_gap":  max(gaps) if gaps else 0,
        "mean_gap": round(np.mean(gaps), 2) if gaps else 0,
        "decades":  decades,
        "span":     s[-1] - s[0] if len(s) > 1 else 0,
    }


def build_frequency_table(draws: List[List[int]], max_number: int = 60) -> Dict[int, int]:
    """Frequência absoluta de cada número nos sorteios."""
    freq: Dict[int, int] = {n: 0 for n in number_range(max_number)}
    for draw in draws:
        for n in draw:
            if 1 <= n <= max_number:
                freq[n] += 1
    return freq


def build_cooccurrence_matrix(draws: List[List[int]], max_number: int = 60) -> np.ndarray:
    """Matriz de co-ocorrência entre pares de números."""
    size = max_number + 1
    mat  = np.zeros((size, size), dtype=np.int32)
    for draw in draws:
        s = sorted(draw)
        for i in range(len(s)):
            for j in range(i + 1, len(s)):
                mat[s[i]][s[j]] += 1
                mat[s[j]][s[i]] += 1
    return mat


def recency_scores(draws: List[List[int]], max_number: int = 60, decay: float = 0.97) -> Dict[int, float]:
    """
    Pontua números pela recência da última aparição.
    Sorteios mais recentes têm peso maior (decay exponencial).
    """
    scores: Dict[int, float] = {n: 0.0 for n in number_range(max_number)}
    total = len(draws)
    for i, draw in enumerate(draws):
        weight = decay ** (total - i - 1)
        for n in draw:
            if n in scores:
                scores[n] += weight
    return scores


def gap_analysis(draws: List[List[int]], max_number: int = 60) -> Dict[int, int]:
    """Quantos sorteios desde a última aparição de cada número."""
    last_seen: Dict[int, int] = {}
    for i, draw in enumerate(draws):
        for n in draw:
            last_seen[n] = i
    total = len(draws)
    return {n: total - last_seen.get(n, 0) - 1 for n in number_range(max_number)}
