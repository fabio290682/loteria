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

No Render:

1. Crie um novo Blueprint
2. Aponte para este repositorio GitHub
3. Confirme os recursos do `render.yaml`
4. Aguarde o deploy

Depois copie a URL publica da API e configure no GitHub:

```text
VITE_API_URL=https://SUA-API.onrender.com
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
