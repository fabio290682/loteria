# Kubernetes

Base de manifests para subir o `LotoMetrics SaaS` em Kubernetes.

## O que entra

- `namespace.yaml`: namespace `lotometrics`
- `configmap.yaml`: configuracoes publicas da aplicacao
- `secret.example.yaml`: template de segredos
- `postgres.yaml`: Postgres com `PVC`
- `backend.yaml`: API FastAPI
- `frontend.yaml`: app React servido por Nginx
- `ingress.yaml`: rota unica com frontend e `/api`

## Ajustes antes de aplicar

1. Troque as imagens:
   - `lotometrics-api:latest`
   - `lotometrics-web:latest`
2. Copie `secret.example.yaml` para um secret real ou aplique com `kubectl create secret`.
3. Ajuste o host em `ingress.yaml` se for usar dominio real.
4. Se o seu cluster nao usa `ingressClassName: nginx`, altere esse valor.

## Aplicacao

```bash
kubectl apply -k k8s
```

## Build das imagens

```bash
docker build -t lotometrics-api:latest ./backend
docker build -t lotometrics-web:latest ./frontend
```

Se estiver em `minikube`:

```bash
minikube image load lotometrics-api:latest
minikube image load lotometrics-web:latest
```

## Acesso local

Para um teste rapido:

```bash
kubectl port-forward -n lotometrics svc/lotometrics-web 8080:80
kubectl port-forward -n lotometrics svc/lotometrics-api 8000:8000
```

Frontend: `http://localhost:8080`

Backend: `http://localhost:8000`
