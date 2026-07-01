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
  daily cap, but requires verifying a sending domain

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
| `ENABLE_CLOUD` | No | Leave as `false`. Enables Stripe billing and usage limits, which only make sense for the hosted plopkit.com service |

`VITE_*` variables are baked into the dashboard at build time, so
changing them later requires rebuilding the `platform` image (see
Troubleshooting below).

## 5. Run the container

Make sure you are in the selfhost directory when running this.

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

## 6. Open the dashboard

Visit whatever you set `PLATFORM_URL` to (e.g. `http://localhost:8080`).
Sign in with your email (magic link) or Google if configured, create a
site, create a widget, and grab the embed script from the dashboard.

## Updating

```bash
git pull
docker compose up -d --build
```

This rebuilds all three images from the latest source and restarts
the stack. Database data persists in a Docker volume and is not
affected.