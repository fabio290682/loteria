# Analise com n8n + ChatGPT + Gemini

Este projeto agora suporta uma camada opcional de reranqueamento por IA.

## Como funciona

1. O backend gera candidatos localmente com o motor estatistico atual.
2. Se `ENABLE_AI_ANALYSIS=true`, ele envia os candidatos para um webhook do `n8n`.
3. O `n8n` consulta `ChatGPT` e `Gemini`.
4. O workflow retorna:

```json
{
  "recommended_order": [2, 0, 1],
  "confidence": 0.82,
  "notes": "Os jogos 2 e 0 ficaram mais equilibrados em distribuicao e atraso.",
  "provider_votes": {
    "chatgpt": "preferiu candidatos com melhor distribuicao",
    "gemini": "preferiu candidatos com menos sequencias e soma mais central"
  }
}
```

5. O backend aplica o novo ranking apenas se a confianca superar `AI_MIN_CONFIDENCE`.

## Variaveis

Adicione no backend:

```env
ENABLE_AI_ANALYSIS=true
AI_ANALYSIS_PROVIDER=n8n
N8N_ANALYSIS_WEBHOOK_URL=https://SEU-N8N/webhook/lotometrics-analysis
N8N_ANALYSIS_TIMEOUT_SECONDS=20
AI_MIN_CONFIDENCE=0.55
```

## Estrutura sugerida no n8n

Fluxo:

1. `Webhook`
2. `Code` para preparar prompt comum
3. `OpenAI Chat Model`
4. `Gemini Chat Model`
5. `Code` para comparar respostas e produzir consenso
6. `Respond to Webhook`

Template pronto no repositorio:

```text
docs/n8n_lotometrics_workflow.json
```

## Como usar o template

1. Importe `docs/n8n_lotometrics_workflow.json` no `n8n`
2. Configure a credencial da OpenAI no no `OpenAI`
3. Defina `GEMINI_API_KEY` no ambiente do `n8n`
4. Ative o workflow
5. Copie a Production URL do webhook
6. Cole essa URL em:

```env
N8N_ANALYSIS_WEBHOOK_URL=https://SEU-N8N/webhook/lotometrics-analysis
```

## Resposta esperada

O webhook deve responder JSON neste formato:

```json
{
  "recommended_order": [2, 0, 1],
  "confidence": 0.82,
  "notes": "ChatGPT e Gemini concordaram no topo do ranking.",
  "provider_votes": {
    "chatgpt": "resumo curto",
    "gemini": "resumo curto"
  }
}
```

## Recomendacao pratica

- Use o motor estatistico local como filtro inicial
- Use `ChatGPT` e `Gemini` para reranquear, nao para inventar numeros do zero
- Guarde o ranking final apenas quando houver consenso ou confianca minima
