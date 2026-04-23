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
