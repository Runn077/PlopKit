# PlopKit

PlopKit is an open-source, self-hostable comment platfor. 
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
 
## Requirements
 
- Docker and Docker Compose
- A Google OAuth client (PlopKit currently uses Google sign-in only)
## 1. Clone the repo
 
```bash
git clone https://github.com/runn077/plopkit
cd plopkit/selfhost
```
 
## 2. Create your Google OAuth credentials
 
PlopKit uses Google OAuth for authentication. You'll need your own
client credentials:
 
1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth
   client ID**
4. Application type: **Web application**
5. Add an authorized redirect URI:
   `http://localhost:3000/api/auth/callback/google`
   (adjust the host/port if you're not running locally)
6. Copy the **Client ID** and **Client Secret** — you'll need these in
   the next step
## 3. Configure environment variables
 
```bash
cp .env.example .env
```
 
Open `.env` and fill in:
 
| Variable | Required | Notes |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Yes | Local DB credentials, pick anything |
| `BETTER_AUTH_SECRET` | Yes | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Yes | The API is reachable at, e.g. `http://localhost:3000` |
| `PLATFORM_URL` | Yes | The platform is reachable at `http://localhost:8080` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Yes | From step 2 |
| `VITE_API_URL` | Yes | Platform's view of the API, e.g. `http://localhost:3000/api` |
| `VITE_AUTH_URL` | Yes | Same as `BETTER_AUTH_URL` |
| `VITE_APP_URL` | Yes | Same as `PLATFORM_URL` |
| `RESEND_API_KEY` | No | Optional. Without it, welcome/account-deleted emails are skipped silently — nothing breaks |
| `ENABLE_CLOUD` | No | Leave as `false`. Enables Stripe billing and usage limits, which only make sense for the hosted plopkit.com service |
 
`VITE_*` variables are baked into the dashboard at build time, so
changing them later requires rebuilding the `platform` image (see
Troubleshooting below).
 
## 4. Easiest way to self host

```bash
cd selfhost
``` 

From here you will find a fully dockerized version of the app which you could run.

```bash
docker compose up -d
```
 
This builds and starts three containers: `db` (Postgres), `api`
(Express server, runs migrations automatically on boot), and
`platform` (the dashboard, served via Nginx). First boot takes a
couple of minutes while images build from source.
 
Check everything's healthy:
 
```bash
docker ps
```
 
All three containers should show `Up`. If `api` is stuck in
`Restarting`, check the logs:
 
```bash
docker logs selfhost-api-1
```
 
## 5. Open the dashboard
 
Visit whatever you set `PLATFORM_URL` to (e.g. `http://localhost:8080`).
Sign in with Google, create a site, create a widget, and grab the
embed script from the dashboard.
 
## Embedding the widget
 
Add the script tag the dashboard gives you to any page:
 
```html
<script src="http://localhost:8080/widget.js" data-widget-key="YOUR_WIDGET_KEY"></script>
```
 
## What's different from the hosted version
 
Nothing, functionally. Self-hosted instances have:
 
- No usage limits on widget loads
- No billing, no Stripe, no upgrade prompts
- The same comment moderation, customization, and dashboard features
  as plopkit.com
The only things that don't apply are billing-specific: the `/usage`
endpoint isn't available (the dashboard shows a simple load count
instead of a plan/limit display), and the newsletter signup endpoint
is inactive.
 
## Updating
 
```bash
git pull
docker compose up -d --build
```
 
This rebuilds all three images from the latest source and restarts
the stack. Database data persists in a Docker volume and is not
affected.
 
## Self-hosting with dockerized db only

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
