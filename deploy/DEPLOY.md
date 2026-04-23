# Deploy em producao

## Opcao 1: VPS com Docker

1. Copie `.env.production.example` para `.env.production` na raiz.
2. Copie `backend/.env.production.example` para `backend/.env.production`.
3. Ajuste dominio, senhas, `SECRET_KEY` e URLs.
4. Suba com:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Servicos expostos:

- frontend: porta 80
- backend: porta 8000
- banco: interno

## Opcao 2: Deploy separado

### Backend

- Build context: `backend/`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers`
- Variaveis: usar `backend/.env.production.example` como referencia

### Frontend

- Build context: `frontend/`
- Variavel de build: `VITE_API_URL=https://SEU_BACKEND_PUBLICO`
- Saida estatica pronta via `npm run build`

## Checklist de producao

- Trocar `SECRET_KEY`
- Definir senha forte do Postgres
- Configurar `CORS_ORIGINS` com os dominios finais
- Configurar webhook real do Stripe ou Mercado Pago
- Colocar HTTPS no dominio
- Fazer backup do volume do Postgres
- Restringir acesso a porta do banco
