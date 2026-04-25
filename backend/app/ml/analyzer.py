"""
Motor principal de análise de padrões de loterias.
Suporta Megasena (60/6), Lotofácil (25/15) e Quina (80/5).
Usa estatística + ML (sklearn) para pontuar e recomendar números.
"""
from __future__ import annotations
from typing import List, Dict
import numpy as np
from sklearn.preprocessing import MinMaxScaler

from .features import (
    number_range,
    extract_draw_features,
    build_frequency_table,
    build_cooccurrence_matrix,
    recency_scores,
    gap_analysis,
)


class LotteryAnalyzer:
    """
    Analisa histórico de sorteios de qualquer loteria e produz:
    - ranking de números quentes/frios/atrasados
    - pares mais frequentes
    - perfil estatístico dos sorteios
    - pontuação composta para sugestão de jogos
    """

    def __init__(self, draws: List[List[int]], max_number: int = 60, game_size: int = 6):
        if not draws:
            raise ValueError("Lista de sorteios não pode ser vazia.")
        self.draws      = draws
        self.n_draws    = len(draws)
        self.max_number = max_number
        self.game_size  = game_size
        self._freq      = build_frequency_table(draws, max_number)
        self._cooc      = build_cooccurrence_matrix(draws, max_number)
        self._recency   = recency_scores(draws, max_number)
        self._gaps      = gap_analysis(draws, max_number)
        self._scores    = self._compute_composite_scores()

    # ── Scores ────────────────────────────────────────────────────────────────

    def _compute_composite_scores(self) -> Dict[int, float]:
        """
        Score composto normalizado [0,1] para cada número.
        Pesos: frequência 40% | recência 35% | ausência inversa 25%
        """
        nums = list(number_range(self.max_number))

        freq_arr    = np.array([self._freq[n]    for n in nums], dtype=float)
        recency_arr = np.array([self._recency[n] for n in nums], dtype=float)
        gap_arr     = np.array([1 / (self._gaps[n] + 1) for n in nums], dtype=float)

        scaler    = MinMaxScaler()
        freq_n    = scaler.fit_transform(freq_arr.reshape(-1, 1)).flatten()
        recency_n = scaler.fit_transform(recency_arr.reshape(-1, 1)).flatten()
        gap_n     = scaler.fit_transform(gap_arr.reshape(-1, 1)).flatten()

        composite = 0.40 * freq_n + 0.35 * recency_n + 0.25 * gap_n
        return {n: round(float(composite[i]), 4) for i, n in enumerate(nums)}

    # ── Público ───────────────────────────────────────────────────────────────

    def hot_numbers(self, top: int = 15) -> List[Dict]:
        """Números mais frequentes nos sorteios históricos."""
        ranked = sorted(self._freq.items(), key=lambda x: x[1], reverse=True)
        return [
            {"number": n, "frequency": f, "score": self._scores[n]}
            for n, f in ranked[:top]
        ]

    def cold_numbers(self, top: int = 15) -> List[Dict]:
        """Números que aparecem menos."""
        ranked = sorted(self._freq.items(), key=lambda x: x[1])
        return [
            {"number": n, "frequency": f, "score": self._scores[n]}
            for n, f in ranked[:top]
        ]

    def overdue_numbers(self, top: int = 15) -> List[Dict]:
        """Números com maior ausência recente (faltantes há mais tempo)."""
        ranked = sorted(self._gaps.items(), key=lambda x: x[1], reverse=True)
        return [
            {
                "number":    n,
                "draws_ago": g,
                "frequency": self._freq[n],
                "score":     self._scores[n],
            }
            for n, g in ranked[:top]
        ]

    def top_pairs(self, top: int = 20) -> List[Dict]:
        """Pares de números que mais saíram juntos."""
        pairs = []
        for i in range(1, self.max_number + 1):
            for j in range(i + 1, self.max_number + 1):
                pairs.append((i, j, int(self._cooc[i][j])))
        pairs.sort(key=lambda x: x[2], reverse=True)
        return [
            {"pair": [a, b], "count": c, "pct": round(c / self.n_draws * 100, 2)}
            for a, b, c in pairs[:top]
        ]

    def score_game(self, game: List[int]) -> Dict:
        """Pontua um jogo específico com base nos padrões históricos."""
        if len(game) != self.game_size:
            raise ValueError(f"Jogo deve ter {self.game_size} números.")
        features   = extract_draw_features(game, self.game_size, self.max_number)
        avg_score  = round(float(np.mean([self._scores[n] for n in game])), 4)
        avg_freq   = round(float(np.mean([self._freq[n]   for n in game])), 2)
        s          = sorted(game)
        cooc_total = 0
        pairs_cnt  = 0
        for i in range(len(s)):
            for j in range(i + 1, len(s)):
                cooc_total += self._cooc[s[i]][s[j]]
                pairs_cnt  += 1
        avg_cooc = round(float(cooc_total / pairs_cnt), 2) if pairs_cnt else 0.0

        return {
            "game":              sorted(game),
            "composite_score":   avg_score,
            "avg_frequency":     avg_freq,
            "avg_cooccurrence":  avg_cooc,
            "features":          features,
            "rating":            self._rating_label(avg_score),
        }

    def suggest_games(self, n_games: int = 5, strategy: str = "balanced") -> List[Dict]:
        """
        Gera sugestões de jogos com base na estratégia escolhida.
        - hot:      prioriza números quentes
        - cold:     prioriza números frios
        - overdue:  prioriza ausentes
        - balanced: mix ponderado pelo score composto
        """
        pool_size = min(self.max_number, max(self.game_size * 4, 20))

        if strategy == "hot":
            pool = sorted(self._scores, key=self._scores.get, reverse=True)[:pool_size]
        elif strategy == "cold":
            pool = sorted(self._scores, key=self._scores.get)[:pool_size]
        elif strategy == "overdue":
            pool = sorted(self._gaps, key=self._gaps.get, reverse=True)[:pool_size]
        else:  # balanced
            pool = list(number_range(self.max_number))

        weights = np.array([self._scores[n] for n in pool], dtype=float)
        if strategy == "cold":
            weights = 1 - weights
        # Garante que todos os pesos sejam positivos
        weights = np.clip(weights, 1e-6, None)
        weights = weights / weights.sum()

        games = []
        rng = np.random.default_rng(seed=42)
        seen: set = set()
        attempts = 0
        while len(games) < n_games and attempts < n_games * 50:
            attempts += 1
            chosen = rng.choice(pool, size=self.game_size, replace=False, p=weights)
            key    = tuple(sorted(chosen))
            if key in seen:
                continue
            seen.add(key)
            scored = self.score_game(list(chosen))
            games.append(scored)

        games.sort(key=lambda g: g["composite_score"], reverse=True)
        return games

    def historical_profile(self) -> Dict:
        """Perfil estatístico agregado de todos os sorteios."""
        all_features = [
            extract_draw_features(d, self.game_size, self.max_number) for d in self.draws
        ]
        sums  = [f["sum"]  for f in all_features]
        odds  = [f["odd"]  for f in all_features]
        lows  = [f["low"]  for f in all_features]
        spans = [f["span"] for f in all_features]
        return {
            "total_draws": self.n_draws,
            "sum_stats": {
                "min":  int(min(sums)),
                "max":  int(max(sums)),
                "mean": round(float(np.mean(sums)), 2),
                "std":  round(float(np.std(sums)),  2),
            },
            "odd_even_avg": {
                "odd":  round(float(np.mean(odds)), 2),
                "even": round(self.game_size - float(np.mean(odds)), 2),
            },
            "low_high_avg": {
                "low":  round(float(np.mean(lows)), 2),
                "high": round(self.game_size - float(np.mean(lows)), 2),
            },
            "avg_span": round(float(np.mean(spans)), 2),
            "most_common_sum_range": self._most_common_sum_range(sums),
        }

    def number_scores(self) -> List[Dict]:
        """Retorna score composto de todos os números, ordenado do maior para o menor."""
        return [
            {"number": n, "score": s, "frequency": self._freq[n], "gap": self._gaps[n]}
            for n, s in sorted(self._scores.items(), key=lambda x: x[1], reverse=True)
        ]

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _rating_label(score: float) -> str:
        if score >= 0.70: return "Excelente"
        if score >= 0.55: return "Bom"
        if score >= 0.40: return "Regular"
        return "Fraco"

    def _most_common_sum_range(self, sums: List[int]) -> Dict:
        expected_mean = self.max_number / 2 * self.game_size / self.max_number * self.max_number
        half = expected_mean / 2
        ranges = {
            f"{int(half*0.8)}-{int(half)}":         0,
            f"{int(half)+1}-{int(half*1.1)}":        0,
            f"{int(half*1.1)+1}-{int(half*1.3)}":    0,
            "outro":                                  0,
        }
        keys = [k for k in ranges if k != "outro"]
        boundaries = []
        for k in keys:
            lo, hi = map(int, k.split("-"))
            boundaries.append((k, lo, hi))

        for s in sums:
            matched = False
            for label, lo, hi in boundaries:
                if lo <= s <= hi:
                    ranges[label] += 1
                    matched = True
                    break
            if not matched:
                ranges["outro"] += 1

        best = max(ranges, key=ranges.get)
        return {"range": best, "count": ranges[best]}


# Alias legado para compatibilidade com código existente
MegasenaAnalyzer = LotteryAnalyzer
