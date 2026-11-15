# SeatWatch

**Software license inventory, utilization review, and estimated spend visibility.**

SeatWatch is a full-stack, role-based application for managing software products, employees, and assigned licenses in a **shared organizational workspace**. It helps administrators identify licenses that may be idle based on **manually recorded activity dates**, review estimated monthly license spending, and mark assignments as pruned while preserving their history.

> **Project scope:** SeatWatch is a portfolio-ready development MVP, not a connected SaaS billing or usage-monitoring service. It does **not** automatically discover subscriptions, retrieve provider activity, revoke vendor access, cancel subscriptions, verify invoices, or confirm realized savings. Monetary values are illustrative unless configured and verified by an operator; the application currently does not model a currency code.

## Features

- **Authentication and authorization:** JWT authentication, secure password hashing, current-role session restoration (`GET /api/auth/me`), and server-enforced role-based permissions.
- **Employee directory:** Manage license assignees independently from login accounts. Employees do not need passwords or application access.
- **Software inventory:** Maintain software products, categories, and estimated monthly per-seat prices.
- **License management:** Assign software to employees, filter and search assignments, inspect recorded activity, and manage active, idle, and pruned states.
- **Utilization review:** A license becomes idle at **30 elapsed 24-hour days** since `last_active_date`. The activity dates are manually recorded, not provider-verified.
- **Spend overview:** View current estimated monthly spending, idle-license potential savings, active/idle/pruned counts, and spending by category.
- **Administration:** Manage login accounts and roles; review available audit entries and system-health views.
- **Accessible interface:** Responsive application shell, keyboard-operable dialogs and navigation, semantic tables, visible focus states, and reduced-motion support.
- **Reproducible local development:** Versioned SQL migrations, isolated PostgreSQL integration/browser tests, and an opt-in synthetic demo-data seed.

## Screenshots

Add sanitized screenshots from the finished UI when publishing the repository. Do not include personal account details, session tokens, database credentials, or browser address bars.

<!-- Suggested images after reviewing and adding them to the repository:
![SeatWatch dashboard](docs/images/dashboard.png)
![License management](docs/images/licenses.png)
-->

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, React Router 7, Vite 7, JavaScript/JSX |
| UI | Tailwind CSS 4, Radix UI primitives, Lucide React, custom SeatWatch semantic design tokens |
| HTTP client | Axios |
| Backend | Node.js, Express 4, PostgreSQL driver (`pg`) |
| Security | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, server-side role/ownership checks |
| Database | PostgreSQL 18 (tested), transactional SQL migrations |
| Tests | Vitest, React Testing Library, Node.js test runner, isolated PostgreSQL integration tests, headless browser QA |

## Architecture

```text
SeatWatch
├── frontend/                    React/Vite application
│   ├── src/pages/               Public, auth, dashboard, and management pages
│   ├── src/components/          Layout, feature, and shared UI components
│   ├── src/context/             Authentication/session state
│   ├── src/services/            API client and endpoint adapters
│   └── src/styles/              Semantic design-system tokens
└── backend/                     Express API
    ├── routes/                  HTTP endpoints and authorization
    ├── controllers/             Request/response handling
    ├── services/                Business rules and account mutations
    ├── models/                  PostgreSQL queries
    ├── middleware/              Authentication and authorization
    ├── migrations/              Ordered schema migrations and runner
    ├── scripts/                 Test harnesses and opt-in seed utilities
    └── test/                    Backend and database tests
```

### Data model

- **`users`** — application accounts, credentials, and roles.
- **`employees`** — credential-free license assignees; may optionally link to an account.
- **`software`** — products and estimated monthly seat prices.
- **`licenses`** — employee/software assignments, recorded activity, and lifecycle status.
- **`schema_migrations`** — ledger of applied migrations.
- **Audit/system tables** — administration logging and health-related records.

Licenses reference employees rather than login accounts. Account deletion does not erase associated employee/license history; deletion of employees or software with license history is restricted by database constraints. The current unique employee/software assignment rule prevents creating another assignment for the same pair, including after pruning.

### Roles and access

| Capability | Viewer | Manager | Admin |
| --- | :---: | :---: | :---: |
| View dashboard, employees, software, and licenses | Yes | Yes | Yes |
| Create/edit employees and software | No | Yes | Yes |
| Create license assignments | No | Yes | Yes |
| Prune/reactivate assignments | No | No | Yes |
| Manage login accounts and roles | No | No | Yes |
| View administrative audit tools | No | No | Yes |

The **backend** is authoritative for authorization; navigation visibility is only a UI convenience. Public registration is disabled. Administrators provision accounts through the authenticated account-management workflow; new accounts initially have the viewer role. An administrator may subsequently assign manager or admin through the protected role endpoint. Admins cannot delete themselves or change their own role, and the last administrator is protected from deletion/demotion.

> **Access policy:** This is **one shared organizational workspace**. Every administrator-provisioned viewer can read its organizational inventory. Provision accounts only for authorized people. SeatWatch does **not** provide per-company tenant isolation.

## Local setup

### Prerequisites

- Node.js **22.22.2** or a compatible currently supported release for the installed Vite toolchain.
- npm.
- PostgreSQL **18** (the migrations and isolated tests have been verified against PostgreSQL 18).
- A local PostgreSQL database and a non-superuser account that owns it.

The commands below use PowerShell on Windows. Adapt paths and commands for other operating systems.

### 1. Get the source

```powershell
# Clone your repository, then open the project root.
git clone https://github.com/Chamindu18/Saas-optimizer.git
cd Saas-optimizer
```

For an existing local checkout, use your project directory instead (for example, `D:\projects\SaaS`).

### 2. Create a dedicated development database

If you already have a database for SeatWatch, **do not recreate or overwrite it**. For a new local installation, use PostgreSQL's administrator account to create a dedicated role and empty database:

```sql
CREATE ROLE seatwatch_user WITH LOGIN;
-- In psql, set its password interactively with: \password seatwatch_user
CREATE DATABASE seatwatch_dev OWNER seatwatch_user;
```

Confirm the target before migrating:

```powershell
psql -h 127.0.0.1 -p 5432 -U seatwatch_user -d seatwatch_dev -c "\dt"
```

An entirely new database should show no tables. Preserve any existing data and back it up before applying migrations to a nonempty database.

### 3. Configure the backend

```powershell
cd backend
npm install
Copy-Item .env.example .env  # only when .env does not already exist
```

Edit `backend/.env` with your private local settings. The example below is illustrative; use the actual settings supported by your checked-out `backend/config/db.js`:

```dotenv
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://seatwatch_user:YOUR_URL_ENCODED_PASSWORD@127.0.0.1:5432/seatwatch_dev
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
FRONTEND_URL=http://localhost:5173
```

- Replace placeholders privately. URL-encode special characters in the database password when using `DATABASE_URL`.
- Use a long, random JWT secret. Never commit `.env`, credentials, or database dumps.
- Older `.env.example` copies may still mention CRA's former `localhost:3000` port; Vite normally serves locally at **5173**.
- Check the final resolved database host, user, and name **before** running migrations or seed operations.

### 4. Apply schema migrations

From `backend/`:

```powershell
npm run migrate
```

The migration runner uses a transactional migration ledger and applies pending files in order:

| Migration | Purpose |
| --- | --- |
| `000-core-schema.sql` | Base accounts, software, and license schema |
| `001-admin-setup.sql` | Administrative support tables and schema |
| `002-employees.sql` | Separate employees from login accounts and migrate license references |
| `003-retain-license-history.sql` | Preserve software/license history through restrictive deletion behavior |

On a fresh database, all four should apply. Applied migrations are skipped on subsequent runs. See [`backend/migrations/README.md`](backend/migrations/README.md) before attempting an upgrade of an existing legacy database.

### 5. Bootstrap the first administrator

Public registration is disabled. The backend provides a separate one-time administrator bootstrap for a new installation:

```powershell
npm run seed:admin
```

This command **requires** environment variables `ADMIN_BOOTSTRAP_NAME`, `ADMIN_BOOTSTRAP_EMAIL`, and `ADMIN_BOOTSTRAP_PASSWORD` (minimum **12 characters**). For interactive PowerShell setup, without writing the password to the terminal history:

```powershell
$env:ADMIN_BOOTSTRAP_NAME = Read-Host 'Admin name'
$env:ADMIN_BOOTSTRAP_EMAIL = Read-Host 'Admin email'
$securePassword = Read-Host 'Admin password (12+ characters)' -AsSecureString
$env:ADMIN_BOOTSTRAP_PASSWORD = [System.Net.NetworkCredential]::new('', $securePassword).Password

# First verify that backend/.env points to your intended local development database.
npm run seed:admin

Remove-Item Env:ADMIN_BOOTSTRAP_NAME,Env:ADMIN_BOOTSTRAP_EMAIL,Env:ADMIN_BOOTSTRAP_PASSWORD -ErrorAction SilentlyContinue
Remove-Variable securePassword -ErrorAction SilentlyContinue
```

The script refuses to create another administrator when one already exists, refuses to promote an existing account, and stores a bcrypt password hash. The password is temporarily held in the bootstrap process environment; keep this operation local and private. **There are no fixed demo administrator credentials.**

### 6. Optional: load synthetic demo records

The demo seed is intentionally separate from administrator bootstrap. It does not create login accounts, and it must **not** be run against production.

From `backend/`, first run its read-only dry run:

```powershell
npm run seed:demo
```

Confirm the printed target is the intended local development database and that checks pass. Then explicitly opt in to applying synthetic records:

```powershell
npm run seed:demo -- --apply --database=seatwatch_dev
```

For an otherwise empty catalog, the fixture inserts:

| Type | Quantity |
| --- | ---: |
| Employees | 20 |
| Software products | 8 |
| Active assignments | 18 |
| Idle assignments | 12 |
| Pruned assignments | 5 |
| **Total license assignments** | **35** |

The fixture's illustrative financial totals are **676.00** estimated current monthly spending and **246.00** estimated potential monthly savings, with **no currency implied**. The schema requires a non-null activity date, so the seed does not insert null activity timestamps.

The seed uses development-only identity/migration checks, transactions, and deterministic identifiers; it is designed for repeat runs without duplicating records or overwriting an administrator. Read [`backend/DEMO_SEED.md`](backend/DEMO_SEED.md) for safety requirements and limitations. **Never commit your database or `.env`.**

### 7. Run the API and web app

Start the Express backend in one terminal:

```powershell
cd backend
npm run dev
```

Start the Vite frontend in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** (or the URL printed by Vite). For local development, `VITE_API_URL` defaults to `/api`, and the configured Vite proxy forwards requests to Express. Sign in as the administrator you bootstrapped, then use Administration to provision viewer accounts and assign approved roles.

## License states and financial definitions

| Status | Meaning | Included in estimated current spend? |
| --- | --- | :---: |
| `active` | Not classified idle using the recorded activity date | Yes |
| `idle` | At least 30 elapsed 24-hour days since recorded activity | Yes |
| `pruned` | Explicitly marked inactive in SeatWatch, history retained | No |

- **Idle threshold:** Exactly 30 × 24 hours, calculated from timestamp instants (not calendar-day labels).
- **Activity data:** Entered manually; a future activity date is rejected by the activity-update API. Missing/provider-unverified activity is not evidence of real usage.
- **Pruning:** Does **not** cancel an external subscription or confirm reduced billing.
- **Reactivation:** Authorized administrators can reactivate a pruned assignment with an explicit recorded activity timestamp.
- **Estimated current monthly spending:** Monthly prices associated with active **and** idle assignments.
- **Estimated potential monthly savings:** Monthly prices associated with currently idle assignments only.
- **Pruned history:** Excluded from both current spending and potential savings.
- **Precision:** The backend uses PostgreSQL `NUMERIC`; monetary totals and percentages are serialized as fixed two-decimal **strings**.

See [`backend/LICENSE_LIFECYCLE.md`](backend/LICENSE_LIFECYCLE.md) for authoritative business rules and limitations.

## API overview

The API is served under `/api`. Representative endpoints include:

| Area | Endpoints |
| --- | --- |
| Authentication | `POST /api/auth/login`, `GET /api/auth/me`; `POST /api/auth/register` always returns 403 |
| Employees | `/api/employees` |
| Software | `/api/software` |
| Licenses | `/api/licenses` |
| Dashboard | `/api/dashboard/stats` |
| Account management | `/api/users`, `/api/admin/users` |
| Administration | `/api/admin/audit-logs` and other authorized admin routes |

Exact methods, request payloads, role policies, and supported lifecycle operations are defined by the backend routes/controllers. Do not infer write permission from the existence of a page or a visible frontend control.

## Testing

From `backend/`:

```powershell
npm test
npm run test:integration:postgres
```

The repository also contains dedicated isolated test harnesses for the demo seed and browser QA. Check the current scripts and their database-targeting safeguards before running them:

```powershell
# From backend/
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/runDemoSeedIntegration.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/runBrowserQa.ps1
```

From `frontend/`:

```powershell
npm test -- --run
npm run build
```

The integration/browser harnesses are designed to use disposable, locally verified PostgreSQL fixtures. **Do not point automated tests at `seatwatch_dev` if they create, change, or delete records.** Browser QA and visual accessibility should still be reviewed manually in the intended release environment.

## Security notes and limitations

- JWTs are signed using a required, private `JWT_SECRET`; missing secrets must fail closed.
- The server entry point refuses to start without `JWT_SECRET`. Configure it before deployment; never put it in frontend environment variables.
- Authentication checks the current account and role in PostgreSQL, not only a potentially stale token role.
- Account API projections exclude password hashes. Role/ownership controls are enforced on the server.
- Organizational summary counts at `/api/stats/home` require authentication.
- Last-admin, self-deletion, and self-role-change protections are enforced in account mutation logic.
- User-supplied SQL parameters are parameterized; database constraints preserve historical relationships.
- The demo data is synthetic, but **real** seeded data is visible to all authorized viewer accounts because this is a shared organizational workspace.
- Audit logging is **best effort** and not a complete, immutable compliance history.
- The app has no invite/approval flow, password reset, email verification, provider integrations, invoice reconciliation, currency setting, or multi-tenant data isolation established for release.
- `POST /api/auth/login` allows 10 failed attempts per client IP in 15 minutes; further attempts receive HTTP 429, a generic message, and `Retry-After` in seconds. Successful logins do not consume the quota. Shared NAT clients share a quota.
- The limiter uses process memory: counters reset on restart and are not shared across replicas. Keep the API to one process for this MVP; distributed deployments need a shared store.
- Express trusts forwarding headers only from explicitly configured proxy IPs/CIDRs. The reverse proxy must replace client-supplied `X-Forwarded-For`; see `DEPLOYMENT.md`.
- The backend audit still reports the `node-cron` → `uuid` advisory. The vulnerable UUID v3/v5/v6 buffer API is not used by this scheduling path; a node-cron 4 upgrade needs separate scheduling compatibility review.
- Seven-day JWTs and browser token storage remain a session risk if client-side script is compromised. Audit logging remains best effort.

**Before public deployment:** Complete security and accessibility review, configure HTTPS and secret management, and verify reverse-proxy/CORS behavior. Treat the local demo as an MVP, not a production security certification.

## Deployment considerations

The production frontend is built with:

```powershell
cd frontend
npm run build
```

The deployment host must:

1. Serve Vite's static output and return `index.html` for client-side React Router paths.
2. Route same-origin `/api` traffic to Express, **or** set `VITE_API_URL` to an approved API URL **at build time** and configure backend CORS accordingly.
3. Provide PostgreSQL, a secure `JWT_SECRET`, the necessary backend environment variables, and verified migrations.
4. Run behind HTTPS with suitable logging, monitoring, backups, and access restrictions.
5. Provision accounts through an authorized administrator and restrict deployment access to the intended organization.

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for repository-specific deployment guidance; review that document against the current Vite setup before following older hosting instructions.

## Development status

The application has undergone incremental work on account security, employee/account separation, PostgreSQL integrity, license lifecycle/financial correctness, Vite migration, responsive design, and browser QA. Public registration now returns 403, and the isolated full browser workflow has passed with administrator provisioning and viewer access checks. Release readiness still requires deployment-specific security and accessibility review.

Additional work to prioritize:

- Verify Login and the administrator-provided access screen against the same design system as the rest of the app.
- Review session lifetime, browser token storage, and distributed login throttling before exposing the shared workspace externally.
- Complete keyboard, screen-reader, contrast, performance, and security release reviews.
- Validate hosting configuration, API proxying, database backups, and environment isolation.

See [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for the project roadmap, if maintained.

## License

No repository license is asserted here. Add a `LICENSE` file only after choosing the intended terms for reuse and distribution.
