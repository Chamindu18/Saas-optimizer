# Deployment Guide

This project is split into a Node/Express backend and a React frontend. The recommended deployment setup is:

- Frontend: Vercel, Netlify, or any static host
- Backend: Render, Railway, Fly.io, or a container host
- Database: Supabase Postgres, Neon, or managed PostgreSQL

## 1. Environment Variables

Create environment variables for both apps from [`.env.example`](.env.example).

Backend variables:
- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`

Frontend variables:
- `VITE_API_URL`

## 2. Database Setup

1. Create a PostgreSQL database.
2. Run the backend migration:

```bash
cd backend
npm run migrate
```

3. Seed demo data:

```bash
npm run seed:demo
```

This creates demo credentials:
- Email: `admin@company.com`
- Password: `demo123`

## 3. Backend Deployment

Recommended runtime environment:
- Node.js 18+
- PostgreSQL access via `DATABASE_URL`

Build / start commands:

```bash
cd backend
npm install
npm run migrate
npm run seed:demo
npm start
```

If the host supports a build step, use the same install and migration commands before start.

### Important backend settings
- Set `JWT_SECRET` to a long random value.
- Set `FRONTEND_URL` to the final frontend domain.
- Do not leave the fallback `.env` values in production.

## 4. Frontend Deployment

Set `VITE_API_URL` to the deployed backend API base URL before building, for example:

```bash
https://your-backend.example.com/api
```

Build command:

```bash
cd frontend
npm install
npm run build
```

Publish the generated `dist/` folder. Configure the static host to serve `index.html` for client-side routes. If `VITE_API_URL` is omitted, proxy `/api` to the backend on the same origin.

## 5. CORS

The backend CORS configuration expects the deployed frontend origin to be listed in `FRONTEND_URL`.

If you use multiple origins, set `FRONTEND_URL` as a comma-separated list.

## 6. Verification Checklist

- Login works with demo or seeded credentials.
- Dashboard loads without hard-coded localhost URLs.
- User, software, and license tables render with real data.
- Admin routes work for admin users only.
- Audit log and role management pages are reachable.
- No secrets are committed to the repository.
