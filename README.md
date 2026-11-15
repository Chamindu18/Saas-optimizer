## SaaS Management & Optimization Platform

Full-stack SaaS asset management app for tracking software licenses, users, spend, and idle capacity. The project now includes a repeatable database schema, seeded demo data, normalized auth/API contracts, and admin tooling suitable for a portfolio or internal demo.

## What It Does

- Authenticates users with JWT and role-based access control.
- Tracks software, assigned licenses, and user ownership.
- Surfaces dashboard metrics for active usage, idle spend, and savings opportunities.
- Provides admin views for users, roles, audit logs, and system health.
- Ships with a schema migration and demo seed data so it can be stood up repeatably.

## Tech Stack

- Backend: Node.js, Express, PostgreSQL, `pg`, `bcryptjs`, `jsonwebtoken`
- Frontend: React, React Router, axios
- Tooling: SQL migrations, seeded demo data, audit logging, environment-based configuration

## Repository Layout

- [backend](backend) - Express API, models, controllers, services, migrations, and seed scripts.
- [frontend](frontend) - React client, pages, components, hooks, and API wrappers.
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Audit summary, missing features, and prioritized roadmap.
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment and environment setup instructions.

## Quick Start

1. Copy [`.env.example`](.env.example) into your local environment and fill in secrets.
2. Install backend dependencies and run migrations.
3. Seed demo data.
4. Start the backend and frontend apps.

### Backend

```bash
cd backend
npm install
npm run migrate
npm run seed:demo
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Backend:

- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`

Frontend:

- `VITE_API_URL` (public API base URL; defaults to `/api`)

## Demo Credentials

After running the demo seed script, sign in with:

- Email: `admin@company.com`
- Password: `demo123`

## Database

The core schema lives in [backend/migrations/000-core-schema.sql](backend/migrations/000-core-schema.sql). It creates the users, software, and licenses tables with foreign keys, constraints, timestamps, and indexes.

## Notable Improvements

- Removed insecure JWT secret fallback.
- Normalized frontend auth storage and API wrappers.
- Added joined license payloads so the dashboard and admin screens can render readable names instead of raw IDs.
- Fixed partial update handling in model methods.
- Added a migration runner that applies all SQL files in lexical order.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup guidance, hosting notes, and verification steps.

## Status

This repository is in a much better demo-ready state than the original baseline, but the [PROJECT_STATUS.md](PROJECT_STATUS.md) file tracks remaining polish items and follow-up priorities.
