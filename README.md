# Zen Casamento — Frontend Independente (PWA)

Frontend autônomo, responsivo e PWA para o casamento de **Patrício & Evandria**. Construído em **React 18**, **TypeScript**, **Vite** e **Vite Plugin PWA**, com design editorial clássico e minimalista.

---

## 🚀 Requisitos

- **Node.js**: `>= 20.0.0` (recomendado Node.js 24)
- **NPM**: `>= 10.0.0`

---

## 📦 Instalação

```bash
# Navegar até a pasta do projeto
cd C:\PROJETOS\zen-casamento-front-end

# Instalar as dependências
npm install
```

---

## ⚙️ Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

### Configurações disponíveis:

| Variável | Descrição | Padrão (Dev) | Padrão (Prod) |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | URL base do backend Fastify | `http://localhost:3000` | `""` (Same-Origin) |
| `VITE_PUBLIC_APP_URL` | URL pública oficial do casamento para links de convite e WhatsApp | `https://patricioeevandria.com.br` | `https://patricioeevandria.com.br` |

> **Nota:** Em produção com reverse proxy (como Nginx / Caddy / Cloudflare), `VITE_API_URL` pode ser deixado vazio para que as requisições utilizem a mesma origem (same-origin), preservando os cookies de sessão com segurança.

---

## 🛠️ Scripts Disponíveis

```bash
# Iniciar o servidor de desenvolvimento Vite (localhost:5173)
npm run dev

# Checagem estática de tipos TypeScript
npm run typecheck

# Validação de linting de código
npm run lint

# Compilar para produção (gera pasta dist/ com Service Worker e assets PWA)
npm run build

# Pré-visualizar localmente o build de produção
npm run preview
```

---

## 📂 Estrutura de Diretórios

```text
zen-casamento-front-end/
├── public/                     # Assets estáticos, ícones PWA, imagens otimizadas, manifest
│   ├── images/wedding/         # Fotografias do casal (formatos AVIF, WebP, JPG)
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── og-preview.jpg          # Cartão Open Graph (WhatsApp / Redes Sociais)
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── src/
│   ├── components/             # Componentes de UI (Hero, Contagem, Floral, Monograma, etc.)
│   ├── contracts/              # Interfaces e DTOs tipados da API (RSVP, Event, Admin, Screen)
│   ├── domain/                 # Funções puras de domínio (contagem regressiva, cronograma)
│   ├── hooks/                  # Hooks React para estado do evento e contexto do dia
│   ├── lib/                    # Cliente HTTP padronizado (apiFetch, buildApiUrl)
│   ├── pages/                  # Páginas da aplicação (Convite, Telão, Painéis Admin)
│   ├── App.tsx                 # Roteador principal da aplicação
│   ├── index.css               # Estilos globais e tokens de design editorial
│   └── main.tsx                # Ponto de entrada React
├── .env.example                # Exemplo de configuração de ambiente
├── eslint.config.js            # Configuração do ESLint
├── index.html                  # Template HTML com meta tags e fontes
├── package.json                # Manifesto de dependências e scripts do frontend
├── tsconfig.json               # Configuração do TypeScript
└── vite.config.ts              # Configuração do Vite e plugin PWA
```

---

## 🗺️ Rotas da Aplicação

### 1. Experiência Pública & Convidados
- `/` ou `/c/:token`: Convite digital personalizado, cronologia, RSVP individual/familiar, confirmação de presença e transição automática no dia do evento (`EVENT_DAY`).

### 2. Telão Interativo
- `/screen` ou `/telao`: Modo telão com bootstrap seguro por token (`?token=...`), exibição em tela cheia e transições suaves de fotos enviadas pelos convidados.

### 3. Painel Administrativo
- `/admin/login`: Autenticação dos noivos / administradores.
- `/admin`: Visão geral operacional (contadores, alertas em tempo real).
- `/admin/guests`: Gestão de famílias, convidados, RSVP, check-in e regeneração de links.
- `/admin/tables`: Mapa e alocação de mesas individuais ou por família.
- `/admin/content`: Programação horária, cardápio por seções e avisos do evento.
- `/admin/media`: Moderação editorial de fotos e vídeos enviados no dia.

---

## 🔒 Autenticação e Cookies

Todas as requisições utilizam `credentials: 'include'`, permitindo o transporte seguro de cookies `HttpOnly` emitidos pelo backend:
- `zen_guest_session`: Sessão do convidado autenticado pelo link do convite.
- `zen_admin_session`: Sessão dos noivos / administração.
- `zen_screen_session`: Sessão do telão interativo.
