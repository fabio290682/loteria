# LotoMetrics SaaS V3

Base comercial de uma SaaS de apoio estatístico para jogos de loteria.

## O que entrou na V3
- autenticação com perfil admin
- limites por plano no backend
- checkout e webhook preparados
- bolões com membros e geração de jogos por grupo
- cache local de resultados e job de sincronização
- painel admin com métricas
- exportação CSV e PDF

## Aviso importante
Este projeto é uma ferramenta de apoio estatístico e heurístico. Não garante acerto, lucro ou previsão real de sorteios.

## Rodando com Docker
```bash
docker compose up --build
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:8000`

Swagger: `http://localhost:8000/docs`

## Kubernetes

Tambem existe uma base pronta em `k8s/` para rodar o projeto em cluster com:

- frontend
- backend
- postgres
- ingress

Guia rapido:

```bash
kubectl apply -k k8s
```

Detalhes em `k8s/README.md`.

## Usuário admin

Cadastre um usuário com email terminando em `@admin.local` para habilitar o painel admin.

Exemplo:
- email: `owner@admin.local`
- senha: `123456`

## Sincronizar resultados manualmente
No container do backend:
```bash
python app/jobs/sync_results.py
```

Ou via API admin:
```bash
POST /results/sync/megasena
```

## Fluxo de cobrança
1. cliente escolhe plano
2. `/subscriptions/checkout` cria referência
3. gateway chama `/subscriptions/webhook/{provider}`
4. assinatura muda para `active`
5. plano do usuário é atualizado

## Próxima sprint sugerida
- webhook Stripe real com assinatura recorrente
- ingestão histórica completa em banco
- conciliação de pagamentos
- convite por email para bolões
- ranking de desempenho por estratégia


## Deploy pronto
Esta versão já inclui:
- `docker-compose.prod.yml`
- `frontend/Dockerfile` com build estático + Nginx
- `backend/Dockerfile` pronto para produção
- `backend/.env.production.example`
- `.env.production.example`
- `deploy/DEPLOY.md`

### Subida em produção
```bash
cp .env.production.example .env.production
cp backend/.env.production.example backend/.env.production
# edite os arquivos com seus domínios e segredos

docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Depois disso:
- frontend em `http://SEU_IP/`
- backend em `http://SEU_IP:8000/docs`
