# 🚀 Deploy LotoMetrics na Web — GitHub Pages

Passo a passo completo para subir o app Flutter no GitHub Pages.

---

## 1. Estrutura de arquivos

Copie os arquivos deste ZIP para dentro do seu projeto Flutter:

```
seu-projeto/
├── .github/
│   └── workflows/
│       └── deploy.yml        ← GitHub Actions (build + deploy automático)
└── web/
    ├── index.html            ← Splash screen com logo 3brasil Tech
    └── manifest.json         ← PWA (instalar no celular pelo browser)
```

---

## 2. Criar repositório no GitHub

1. Acesse https://github.com/new
2. Nome sugerido: `lotometrics` (vai ficar como `seu-user.github.io/lotometrics`)
3. Marque **Public** (necessário para GitHub Pages gratuito)
4. Clique em **Create repository**

---

## 3. Subir o código

No terminal, dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "feat: LotoMetrics × 3brasil Tech v2.1"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/lotometrics.git
git push -u origin main
```

---

## 4. Ativar GitHub Pages

1. No repositório → **Settings** → **Pages**
2. Em **Source** → selecione **GitHub Actions**
3. Clique em **Save**

---

## 5. Aguardar o deploy

Após o `git push`, acesse:

```
https://github.com/SEU_USUARIO/lotometrics/actions
```

Você verá o workflow **"Deploy Flutter Web"** rodando. Leva ~3 minutos.

---

## 6. Acessar a URL

Após concluir, o app estará disponível em:

```
https://SEU_USUARIO.github.io/lotometrics/
```

---

## 7. URL do backend para produção web

No arquivo `lib/core/api/api_client.dart`, troque para a URL de produção:

```dart
static const String baseUrl = 'https://SEU-BACKEND.com';
```

> ⚠️ No GitHub Pages (HTTPS), o backend também precisa ser HTTPS.
> Use Railway, Render ou Fly.io para hospedar o backend com SSL gratuito.

---

## 8. Modo demo (sem backend)

Para testar o design sem backend, adicione mock data em `services.dart`:

```dart
// Em GameService.generateGame(), retorne dados mockados:
return Game(
  id: DateTime.now().millisecondsSinceEpoch,
  lotteryType: lotteryType,
  numbers: List.generate(quantity, (i) => i + 1)..shuffle(),
  createdAt: DateTime.now(),
  strategy: strategy,
);
```

---

## Atualizações futuras

Qualquer `git push` para `main` dispara o deploy automaticamente:

```bash
git add .
git commit -m "fix: melhoria na tela de resultados"
git push
```

O site atualiza em ~3 minutos.
