# LotoMetrics SaaS V3

Base comercial de uma SaaS de apoio estatistico para jogos de loteria.

## Estrutura

- `frontend/`: app React + Vite publicado no GitHub Pages
- `backend/`: API FastAPI
- `deploy/`: notas de deploy em producao

## GitHub Pages

O repositiorio esta configurado para publicar o frontend no GitHub Pages via GitHub Actions.

URL esperada:

```text
https://fabio290682.github.io/loteria/
```

Antes do site funcionar com dados reais, configure a variavel do repositorio:

```text
VITE_API_URL=https://SEU_BACKEND_PUBLICO
```

Caminho no GitHub:

```text
Settings > Secrets and variables > Actions > Variables
```

Sem essa variavel, o frontend cai no fallback local `http://localhost:8000`.

## Backend em producao

Para o SaaS funcionar de verdade no navegador, publique o backend com HTTPS.

Este repositorio ja inclui um Blueprint do Render em `render.yaml`.

Fluxo recomendado:

1. Publicar `lotometrics-api` no Render usando `render.yaml`
2. Copiar a URL publica gerada pelo backend
3. Criar a variavel `VITE_API_URL` no GitHub com essa URL
4. Manter `CORS_ORIGINS` liberando `https://fabio290682.github.io`

Exemplo final:

```text
VITE_API_URL=https://lotometrics-api.onrender.com
```

## Desenvolvimento local

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Docker

```bash
docker compose up --build
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:8000`

Swagger: `http://localhost:8000/docs`

## Observacao

GitHub Pages hospeda apenas o frontend estatico. Para login, dashboard e integracoes funcionarem, o backend precisa estar publicado com HTTPS e CORS liberado para `https://fabio290682.github.io`.
