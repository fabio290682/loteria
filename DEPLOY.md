# Deploy

## GitHub Pages

O frontend deste projeto e publicado pelo workflow:

```text
.github/workflows/static.yml
```

O build usa:

- diretorio: `frontend/`
- framework: React + Vite
- saida: `frontend/dist`

Variaveis necessarias no GitHub:

```text
VITE_API_URL=https://SEU_BACKEND_PUBLICO
```

Depois de definir a variavel, deixe o Pages em:

```text
Settings > Pages > Source = GitHub Actions
```

## Backend

O backend nao roda no GitHub Pages. Publique a API separadamente em um servico com HTTPS, por exemplo:

- Render
- Railway
- Fly.io
- VPS com Docker

## Render

O repositorio ja inclui `render.yaml` para subir:

- banco Postgres gerenciado
- backend `lotometrics-api`

Blueprint direto:

```text
https://dashboard.render.com/blueprint/new?repo=https://github.com/fabio290682/loteria
```

No Render:

1. Crie um novo Blueprint
2. Aponte para este repositorio GitHub
3. Confirme os recursos do `render.yaml`
4. Aguarde o deploy

Depois copie a URL publica da API e configure no GitHub:

```text
VITE_API_URL=https://SUA-API.onrender.com
```

Se quiser ativar a camada de IA depois do backend estar no ar:

```text
ENABLE_AI_ANALYSIS=true
AI_ANALYSIS_PROVIDER=n8n
N8N_ANALYSIS_WEBHOOK_URL=https://SEU-N8N/webhook/lotometrics-analysis
N8N_ANALYSIS_TIMEOUT_SECONDS=20
AI_MIN_CONFIDENCE=0.55
```

## CORS

No backend de producao, libere pelo menos:

```text
https://fabio290682.github.io
https://fabio290682.github.io/loteria
```

## VPS com Docker

1. Copie `.env.production.example` para `.env.production`.
2. Copie `backend/.env.production.example` para `backend/.env.production`.
3. Ajuste dominios, segredos e conexao com banco.
4. Suba com:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## Kubernetes

O repositorio agora tambem inclui manifests em `k8s/` para:

- `frontend`
- `backend`
- `postgres`
- `ingress`

Passo rapido:

```bash
kubectl apply -k k8s
```

Ajustes esperados antes de aplicar:

- trocar as imagens `lotometrics-api:latest` e `lotometrics-web:latest`
- definir segredos reais em `k8s/secret.example.yaml`
- ajustar o host do `ingress`
