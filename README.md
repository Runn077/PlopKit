## Self-hosting

1. Clone the repo
```bash
   git clone https://github.com/rulin077/plopkit
   cd plopkit
```

2. Copy the example env files and fill in your values
```bash
   cp .env.example .env
   cp api/.env.example api/.env
   cp platform/.env.example platform/.env
   cp widget-svelte/.env.example widget-svelte/.env
```

3. Start Postgres
```bash
   docker compose up -d
```

4. Run migrations and start the API
```bash
   cd api && npm install && npx prisma migrate deploy && npm run build && npm start
```

5. Start the platform
```bash
   cd widget-svelte && npm install && npm run build
```

6. Start the platform
```bash
   cd platform && npm install && npm run dev
```