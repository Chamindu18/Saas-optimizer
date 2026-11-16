# SeatWatch API

The Express API stores accounts, employees, software, license assignments, audit entries, and health records in PostgreSQL. Routes in `routes/` call controllers and services; models use the `pg` connection in `config/db.js`. See the [root README](../README.md) for the product model, roles, license lifecycle, and complete local setup.

## Setup

Use Node.js 22.12+ and PostgreSQL 18 for the verified Windows setup. Create a dedicated database and owner, then configure `backend/.env` from [`.env.example`](.env.example). Required connection and security settings are `DATABASE_URL` and a private, long `JWT_SECRET`. `PORT` defaults to 5000. Set `FRONTEND_URL` to the allowed frontend origin (locally `http://localhost:5173`); a comma-separated list is supported. The production host must supply its own values. Never commit `.env` or put backend secrets in `VITE_` variables.

```powershell
cd backend
npm install
npm run migrate
npm run seed:admin
npm run dev
```

Check the database target before migration or bootstrap. The SQL runner `migrations/runMigration.js` applies migrations 000–003 in order and records them in `schema_migrations`. Read the [migration notes](migrations/README.md) before upgrading a nonempty or legacy database. `seed:admin` requires explicit `ADMIN_BOOTSTRAP_NAME`, `ADMIN_BOOTSTRAP_EMAIL`, and `ADMIN_BOOTSTRAP_PASSWORD` (at least 12 characters). It refuses a second administrator or promotion of an existing account. There are no default credentials.

Public `POST /api/auth/register` is disabled. Administrators provision login accounts in the protected account workflow; employees are separate, credential-free license assignees. JWT login and `/api/auth/me` validate the current account and role. The server enforces Viewer, Manager, and Admin permissions in one shared organizational workspace.

`npm run seed:demo` is a development-only, read-only preview by default. Applying synthetic inventory requires `npm run seed:demo -- --apply --database=seatwatch_dev` after reviewing the target. It creates no login account. Read [demo seed safety notes](DEMO_SEED.md) first. Its financial values are illustrative and currency-neutral.

## Verification

Run these commands from `backend/`:

```powershell
npm test
npm run test:integration:postgres
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/runDemoSeedIntegration.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/runIsolatedBrowserQa.ps1
```

The PostgreSQL and browser harnesses create identity-verified disposable local clusters under `%TEMP%`; they do not target the persistent development database. The comprehensive browser command also builds the frontend and runs application, landing, and authentication checks. The scripts expect local PostgreSQL 18 binaries at `C:\Program Files\PostgreSQL\18\bin` and a browser available to the existing QA launcher. Do not direct mutation tests at `seatwatch_dev` or a hosted database.

## Security and deployment notes

The login endpoint allows 10 failed requests per client IP per 15 minutes, then responds with 429 and `Retry-After`. Successful logins do not count. Its memory store resets on process restart and is not shared across replicas; users behind one NAT share a quota. Configure `TRUSTED_PROXY_CIDRS` only for verified proxy addresses or narrow CIDRs, and require that proxy to replace client-supplied `X-Forwarded-For`.

JWTs are stored in the browser, so client-side script compromise remains a session risk. Audit writes are best effort, not a compliance record. The `node-cron` → `uuid` moderate advisory remains subject to the current audit result and a separate scheduling compatibility review. See [deployment guidance](../DEPLOYMENT.md) for HTTPS, secrets, CORS, proxy, and production verification work. The API is not production-certified by local test results.
