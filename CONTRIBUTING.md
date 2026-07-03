# Contributing to PlopKit

Thanks for wanting to contribute! Here's what you need to know.

## Project structure

- `api/` — Node/Express/TypeScript backend
- `platform/` — React/Vite dashboard
- `widget-svelte/` — Svelte 5 embeddable widget
- `selfhost/` — Docker Compose for self-hosting

### Prerequisites

- Node.js 24+ 
- PostgreSQL (or use the provided Docker Compose setup)
- Docker and Docker compose

## Setup with dockerized db

1. Copy the example env files and fill in your values
```bash
   cp .env.example .env
   cp api/.env.example api/.env
   cp platform/.env.example platform/.env
   cp widget-svelte/.env.example widget-svelte/.env
```

2. Start Postgres
```bash
   docker compose up -d
```

3. Run migrations and start the API
```bash
   cd api && npm install && npx prisma migrate deploy && npm run build && npm start
```

4. Build the widget
```bash
   cd widget-svelte && npm install && npm run build
```

5. Start the platform
```bash
   cd platform && npm install && npm run dev
```
## How to contribute

1. Fork the repo on GitHub.
2. Clone your fork locally:
```bash
   git clone https://github.com/YOUR-USERNAME/plopkit.git
```
3. Create a branch for your change:
```bash
   git checkout -b fix/short-description
```
4. Make your changes, following the guidelines below.
5. Commit using conventional commits (`feat:`, `fix:`, `chore:`, etc.), keeping commits small and focused.
6. Push to your fork and open a pull request against `Runn077/plopkit`'s `main` branch, with a clear description of what changed and why.

For small fixes, feel free to open a PR directly. For larger changes (new features, architecture changes), consider opening an issue first to discuss the approach before investing a lot of time.

## Guidelines

- No cross-package imports between `api/` and `platform/`.
- Everything in `api/src/cloud/` is hosted-only stuff (billing, usage limits) most contributions won't need to touch it.

## Commits & PRs

- Use conventional commits (`feat:`, `fix:`, `chore:`, etc.).
- Keep commits small and focused.
- Open a PR against `main` with a clear description of what changed and why.

## Bugs & questions

Open a GitHub issue, or email plopkitcontact@gmail.com.

## License

PlopKit uses AGPL-3.0 license. By contributing, you agree your changes are licensed the same way.