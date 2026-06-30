# PlopKit

PlopKit is an open-source, self-hostable comment platform. 
Create comment widgets in seconds, embed them anywhere with a
single script and manage everything from a clean web dashboard.

- 💬 Modern embedded comment widgets
- 🛡️ Built-in moderation tools
- 🐳 Easy Docker deployment
- 🔓 Fully open source and self-hostable

Visit plopkit.com to see what it looks like.

# Self hosting PlopKit
 
PlopKit is fully self-hostable. Self-hosted instances have no feature
restrictions compared to the hosted version at plopkit.com. Billing,
usage limits, and the newsletter are the only things specific to the
hosted service, and none of that code runs in self-hosted mode.
 
# Running locally

## Clone the repo
 
```bash
git clone https://github.com/runn077/plopkit
```
## Easiest way to self host
go to the selfhost directory and read the instruction there.

## Self hosting with dockerized db

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

## Find any issues?
 
Feel free to open an issue if you find anything.
