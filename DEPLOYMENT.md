# Deployment review guide

SeatWatch has a React/Vite static frontend, an Express API, and PostgreSQL. This is reference material for any future deployment; hosting is outside the completed GitHub-only portfolio MVP scope. It does not select a host or certify a production deployment. See the [root README](README.md) for the data model and local setup.

## Configuration

Keep backend configuration in the host's secret manager, never in the repository or a `VITE_` variable. Use [`.env.example`](.env.example) as a list of names, replacing all placeholders privately.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string for the reviewed target. The backend uses `pg` connection-string behavior; configure any managed-service TLS requirements explicitly for that provider. |
| `JWT_SECRET` | Long random signing secret. The server refuses startup without it. |
| `NODE_ENV` | Set to `production` for production. |
| `PORT` | Express listener; defaults to 5000 locally. |
| `FRONTEND_URL` | Exact allowed browser origin, including scheme and port if present. Comma-separated origins are supported. |
| `TRUSTED_PROXY_CIDRS` | Optional exact proxy IPs or narrow CIDR ranges, comma-separated. Leave unset for direct connections. |
| `VITE_API_URL` | Public frontend build-time API base URL; defaults to `/api`. |

Serve the site and API over HTTPS. For one origin, route `/api` to Express and leave `VITE_API_URL=/api`. For separate origins, set `VITE_API_URL` to the HTTPS API URL ending in `/api` before the frontend build, and list the frontend's **origin** in backend `FRONTEND_URL`. Vite embeds its value at build time; rebuild after changing it. Configure the static host to return `index.html` for React Router paths. The API's CORS middleware allows only the configured origin list and sends credentials support; verify the actual browser request path before any future deployment.

Behind a reverse proxy, list only verified proxy addresses in `TRUSTED_PROXY_CIDRS`. The proxy must replace untrusted incoming `X-Forwarded-For`. Verify the resolved client IP (`req.ip`) through the real proxy before launch. The login limiter allows 10 failed requests per client IP per 15 minutes, sends 429 and `Retry-After` after the limit, resets on restart, and is local to one process. A multi-instance deployment needs a shared rate-limit store. Clients behind one NAT share a quota.

## Database and first administrator

Create a dedicated PostgreSQL database and least-privileged owner. Back up and review any nonempty target before migration. From `backend/`, with a private `DATABASE_URL` pointing to the approved database:

```powershell
npm install
npm run migrate
```

The migration runner applies SQL files 000–003 and records them in `schema_migrations`. Read the [migration notes](backend/migrations/README.md) for legacy-schema and rollback constraints. Confirm database identity and migration results before serving traffic.

On a new installation, privately set `ADMIN_BOOTSTRAP_NAME`, `ADMIN_BOOTSTRAP_EMAIL`, and `ADMIN_BOOTSTRAP_PASSWORD` (minimum 12 characters), then run `npm run seed:admin` from `backend/`. Remove the bootstrap values from the process environment after use. There are no default passwords. The script refuses another administrator or promotion of an existing account. Public registration is disabled; administrators provision later accounts through the protected UI. The [demo seed](backend/DEMO_SEED.md) is development-only and must not be run as deployment setup.

## Build and start

From `backend/`, run `npm start` after configuration and migration. From `frontend/`, set `VITE_API_URL` if needed and run:

```powershell
npm install
npm run build
```

Publish `frontend/dist/` as static assets. The API root `/` returns a basic JSON description; administrative health-check records are available only through the protected `/api/admin/system-health` route. Do not treat either as a complete external readiness probe without a deployment-specific design.

## Future deployment verification

Review HTTPS termination, secret rotation and storage, PostgreSQL TLS and backups, migration rollback, API origin and CORS, proxy IP behavior, one-process versus distributed rate limiting, JWT lifetime/browser storage, logs, and access restrictions. Run production smoke checks for login, role boundaries, dashboard and management flows, and the chosen health signal. Confirm keyboard, zoom, contrast, and actual screen-reader usability in the target environment. The [project status](PROJECT_STATUS.md) records current limitations.
