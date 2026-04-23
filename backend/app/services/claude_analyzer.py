import json
import os
import re

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

LOTTERY_CONFIG = {
    "megasena": {"total": 60, "picks": 6, "name": "Mega-Sena", "soma_min": 100, "soma_max": 240},
    "lotofacil": {"total": 25, "picks": 15, "name": "Lotofacil", "soma_min": 120, "soma_max": 220},
    "quina": {"total": 80, "picks": 5, "name": "Quina", "soma_min": 80, "soma_max": 250},
}


def _build_prompt(lottery_type: str, candidates: list, hot_numbers: list, delayed_numbers: list) -> str:
    cfg = LOTTERY_CONFIG.get(lottery_type, LOTTERY_CONFIG["megasena"])

    candidates_text = "\n".join([
        f"Jogo {i + 1}: {sorted(c.get('numbers', []))} | "
        f"soma={c.get('game_sum', sum(c.get('numbers', [])))} | "
        f"pares={c.get('even_count', 0)} | "
        f"score={c.get('score', 0)}"
        for i, c in enumerate(candidates[:10])
    ])

    hot_text = f"Dezenas mais frequentes nos ultimos concursos: {hot_numbers[:12]}" if hot_numbers else ""
    delayed_text = f"Dezenas com maior atraso (prestes a sair): {delayed_numbers[:8]}" if delayed_numbers else ""

    return f"""Voce e um especialista em analise estatistica de loterias brasileiras com foco em combinatoria e padroes historicos.

=== CONTEXTO DA LOTERIA ===
Loteria: {cfg['name']}
Formato: escolher {cfg['picks']} dezenas de 1 a {cfg['total']}
Faixa de soma estatisticamente favoravel: {cfg['soma_min']} a {cfg['soma_max']}
{hot_text}
{delayed_text}

=== CANDIDATOS GERADOS PELO MOTOR ESTATISTICO ===
{candidates_text}

=== INSTRUCOES DE ANALISE ===
Avalie cada jogo pelos seguintes criterios:
1. Equilibrio par/impar (ideal: proximo de 50/50)
2. Distribuicao por faixas (baixas 1-{cfg['total']//3} / medias / altas)
3. Presenca de dezenas quentes E atrasadas (diversificacao)
4. Soma total dentro da faixa favoravel
5. Ausencia de sequencias consecutivas longas (3+ numeros seguidos penaliza)
6. Ausencia de padroes geometricos obvios (multiplos de 5, 10 etc.)

Responda SOMENTE com JSON valido, sem texto adicional, neste formato exato:
{{
  "ranking": [2, 1, 4, 3],
  "confiancas": [0.91, 0.84, 0.76, 0.68],
  "notas": [
    "Excelente distribuicao com 3 quentes e 1 atrasada. Soma ideal.",
    "Bom equilibrio par/impar mas concentracao na faixa baixa.",
    "Score alto porem sequencia de 3 consecutivos penaliza levemente.",
    "Distribuicao fraca, maioria na faixa media."
  ],
  "estrategia": "Priorize jogos com dezenas distribuidas entre as tres faixas e presenca de pelo menos uma dezena atrasada de alto impacto.",
  "alerta": "Evite concentrar mais de 4 dezenas na mesma faixa numerica."
}}"""


def _parse_response(text: str, candidates: list) -> dict | None:
    try:
        match = re.search(r'\{[\s\S]*\}', text)
        if not match:
            return None
        data = json.loads(match.group())

        ranking = data.get("ranking", list(range(1, len(candidates) + 1)))
        confiancas = data.get("confiancas", [0.75] * len(candidates))
        notas = data.get("notas", [""] * len(candidates))
        estrategia = data.get("estrategia", "")
        alerta = data.get("alerta", "")

        result = []
        seen = set()
        for rank_pos, pos in enumerate(ranking):
            idx = pos - 1
            if 0 <= idx < len(candidates) and idx not in seen:
                seen.add(idx)
                game = dict(candidates[idx])
                game["ai_confidence"] = float(confiancas[rank_pos]) if rank_pos < len(confiancas) else 0.70
                game["ai_notes"] = notas[rank_pos] if rank_pos < len(notas) else ""
                game["ai_provider_votes"] = {"claude": estrategia}
                game["source"] = "ai-ranked"
                result.append(game)

        for i, c in enumerate(candidates):
            if i not in seen:
                result.append(dict(c))

        return {"games": result, "estrategia": estrategia, "alerta": alerta, "provider": "claude"}
    except Exception as e:
        print(f"[claude_analyzer] parse error: {e}")
        return None


def analyze_and_rank(
    lottery_type: str,
    candidates: list,
    hot_numbers: list | None = None,
    delayed_numbers: list | None = None,
) -> dict | None:
    if not ANTHROPIC_API_KEY:
        return None
    if len(candidates) < 2:
        return None

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        prompt = _build_prompt(lottery_type, candidates, hot_numbers or [], delayed_numbers or [])

        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system="Voce e um analisador estatistico de loterias. Responda sempre com JSON valido e preciso.",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

        raw = message.content[0].text
        return _parse_response(raw, candidates)

    except Exception as e:
        print(f"[claude_analyzer] error: {e}")
        return None
