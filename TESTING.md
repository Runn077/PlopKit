# Testing

PlopKit has two layers of automated tests in `api/`: 

- **unit tests** (no setup required) and 
- **integration tests** (require a running Postgres test database).

## Unit tests

Cover validators, services, and select middleware/lib files with mocked dependencies (Prisma, Stripe, nodemailer, etc.). No database or network access required.

```bash
cd api
npm test
```


## Integration tests

Cover route handlers end-to-end (Express → service → real Postgres) using Supertest.

### One-time setup

1. Start the test database (run in root dir):
```bash
   docker compose up -d db_test
```
   This runs a separate, `tmpfs`-backed Postgres instance on port `5433`, fully isolated from your dev database. Data does not persist across container restarts.

2. Create `api/.env.test` from the example:
```bash
   cp api/.env.test.example api/.env.test
```
   Fill in the same `POSTGRES_PASSWORD` used in your root `.env`.

3. Apply migrations to the test database:
```bash
   cd api
   npm run test:integration:migrate
```

### Running integration tests

```bash
cd api
npm run test:integration
```

Each test file's `beforeEach` truncates all tables before every test, so tests always start from a known-empty state. Test data is seeded per-test via helper functions (e.g. `seedSiteWithWidget()`) rather than shared fixtures, so tests never depend on each other's state or execution order.

### Re-run the migrate step when...

- You add a new Prisma migration (`npx prisma migrate dev` against your real dev DB), the test DB needs that same migration applied, or tests will fail against a stale schema.
- You've reset or recreated the `db_test` container (its data doesn't persist, so a fresh container starts with no schema at all).

## Test types by directory

| Location | Type | What it covers |
|---|---|---|
| `api/src/**/tests/*.test.ts` | Unit | Validators, services, middleware, lib (mocked dependencies) |
| `api/tests/routes/*.test.ts` | Integration | Route handlers against real Postgres |
| `api/tests/app.test.ts` | Integration | CORS, error handling, `ENABLE_CLOUD` route gating |