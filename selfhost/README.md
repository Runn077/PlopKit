# Self-hosting PlopKit

Run your own PlopKit instance with Docker Compose. Self-hosted
instances have no feature restrictions compared to the hosted
version at plopkit.com, billing and usage limits are the only
things specific to the hosted service, and none of that code runs
here.

## Requirements

- Docker and Docker Compose
- An SMTP provider (for magic link sign-in and account emails)
  Gmail, Amazon SES, or any SMTP relay works
- (Optional) A Google OAuth client, if you also want Google sign-in

## 1. Clone the repo

```bash
git clone https://github.com/runn077/plopkit
cd plopkit/selfhost
```

## 2. Set up email (required for sign-in)

PlopKit uses magic link sign-in by default. No OAuth app registration
required. Users enter their email and get a one-click sign-in link, so
you'll need SMTP credentials for PlopKit to send that email.

Any SMTP provider works. Quick options:

- **Gmail** (fastest for testing): enable 2FA on a Gmail account, then
  generate an app password.
- **Amazon SES** (recommended for real use): cheap, no restrictive
  daily cap, but requires verifying a sending domain.

You'll need the host, port, username, and password for the next step.

## 3. (Optional) Set up Google OAuth

If you'd also like a "Continue with Google" button alongside magic
link:

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth
   client ID**
4. Application type: **Web application**
5. Add an authorized redirect URI:
   `http://localhost:3000/api/auth/callback/google`
   (adjust the host/port if you're not running locally)
6. Copy the **Client ID** and **Client Secret**

Skip this step if magic link alone is enough for you.

## 4. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Required | Notes |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Yes | Local DB credentials, pick anything |
| `BETTER_AUTH_SECRET` | Yes | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Yes | Where the API is reachable, e.g. `http://localhost:3000` |
| `PLATFORM_URL` | Yes | Where the platform is reachable, e.g. `http://localhost:8080` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Yes | From step 2. Required — sign-in emails won't send without these |
| `SMTP_SECURE` | No | `true` for port 465, `false` for port 587 (default) |
| `EMAIL_FROM` | Yes | The address emails are sent from, e.g. `noreply@yourdomain.com` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Only needed if you set up Google OAuth in step 3 |
| `VITE_API_URL` | Yes | Platform's view of the API, e.g. `http://localhost:3000/api` |
| `VITE_AUTH_URL` | Yes | Same as `BETTER_AUTH_URL` |
| `VITE_APP_URL` | Yes | Same as `PLATFORM_URL` |
| `PUBLIC_DEMO_WIDGET_KEY` | No | Optional demo widget key for the marketing site. Leave blank to skip it |

`VITE_*` variables are baked into the dashboard at build time, so
changing them later requires rebuilding the `platform` image (see
Troubleshooting below).

## 5. Run the containers

Make sure you are in the `selfhost` directory when running this.

```bash
docker compose up -d
```

This builds and starts four containers:

- `db` — Postgres, with a healthcheck the `api` container waits on
- `api` — Express server; runs `prisma migrate deploy` automatically
  on every boot, then starts the server
- `platform` — the dashboard, served via Nginx on port 8080
- `web` — the marketing site and docs, served via Nginx on port 4321

First boot takes a couple of minutes while images build from source.

Check everything's healthy:

```bash
docker ps
```

All four containers should show `Up`. If `api` is stuck in
`Restarting`, check the logs:

```bash
docker logs selfhost-api-1
```

## 6. Open the dashboard

Visit whatever you set `PLATFORM_URL` to (e.g. `http://localhost:8080`).
Sign in with your email (magic link) or Google if configured, create a
site, create a widget, and grab the embed script from the dashboard.

The marketing site and docs are served separately at
`http://localhost:4321`.

## Updating

```bash
git pull
docker compose up -d --build
```

This rebuilds all images from the latest source and restarts the
stack. Database data persists in the `postgres_data` Docker volume
and is not affected. Migrations are re-applied automatically on `api`
startup.

## Troubleshooting

**Changed a `VITE_*` variable and the dashboard didn't pick it up:**
these are baked in at build time. Rebuild the platform image:

```bash
docker compose up -d --build platform
```

**`api` container keeps restarting:** almost always a bad or missing
`DATABASE_URL`, `SMTP_*`, or `BETTER_AUTH_SECRET`. Check logs with
`docker logs selfhost-api-1` and confirm your `.env` values.

**Sign-in emails aren't arriving:** double-check `SMTP_HOST` /
`SMTP_PORT` / `SMTP_SECURE` against your provider's docs — a mismatched
`SMTP_SECURE` value against the port is the most common cause.