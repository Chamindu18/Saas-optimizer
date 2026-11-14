# Project Status Report

Date: 2026-05-08

## Executive Summary
The project is a full-stack SaaS license management platform with a Node/Express/PostgreSQL backend and a React (CRA) frontend. It has strong building blocks (auth, admin metrics, idle detection, design system work), but the codebase is inconsistent across API contracts, auth storage keys, UI component systems, and routing. These inconsistencies currently prevent end-to-end flows from working and introduce security/config risks.

## Architecture Snapshot
- Backend: Express app with controllers/services/models, PostgreSQL via `pg`, cron-based idle license checks.
- Frontend: CRA React app with multiple UI systems ("common" vs "ui" components) and two design systems, plus mixed API usage (axios + fetch).
- Auth: JWT with role-based access control.

## Primary Risks
- Contract mismatch between frontend API calls and backend routes/response shapes.
- Token storage keys inconsistent across the frontend; role decoding is unreliable.
- Missing core database schema migration for users/software/licenses.
- Admin and audit pages exist but are not wired to routes.
- CORS configuration allows `*` with credentials.
- JWT secret fallback in production paths.

## Functional Gaps (Missing or Broken)
### Backend
- Core schema migration for users, software, licenses (tables, FK constraints, indexes).
- Validation layer for request payloads (currently ad-hoc in services/controllers).
- Partial update safety for licenses (current update overwrites with undefined fields).
- Consistent API response shapes across controllers.

### Frontend
- API client definitions mismatch actual endpoints (`admin`, `users`, `licenses`).
- Role/token storage mismatch (`auth_token` vs `seatwatch_token`).
- Admin / Role Management / Audit Log pages not routed.
- Duplicate UI component systems and design tokens create inconsistent UX.
- Hard-coded API URLs in multiple pages.

### Docs & Repo Hygiene
- Root README is not aligned with current behavior and env config.
- No root `.gitignore`, no root `LICENSE`.
- Missing root `.env.example` with required variables.

## Security Review
- JWT secret falls back to hard-coded value.
- CORS uses `*` with credentials.
- Token stored in localStorage (acceptable for portfolio, but needs explicit risk note and XSS hygiene).
- No input validation middleware or rate limiting.

## Observed Inconsistencies
- Frontend calls `/admin/health`, backend serves `/admin/system-health`.
- Frontend expects `activeCount` and `savingsPercentage`, backend returns `activeLicenses` and no percentage.
- Frontend admin API helper methods do not exist in backend.

## Immediate Priorities (P0)
1. Align API contracts end-to-end (routes + response shapes + frontend API client).
2. Standardize auth token/user storage and role decoding.
3. Add core database schema migration and seed/demo data.
4. Fix unsafe CORS and remove JWT fallback.

## Near-Term Priorities (P1)
1. Consolidate UI component system and design tokens.
2. Wire all pages into the router; remove dead pages.
3. Standardize empty/loading/error states.

## Deferred (P2)
1. Add rate limiting and request validation middleware.
2. Add tests (unit + API integration).
3. Add deployment docs and scripts.

## Proposed Roadmap
- Phase A: API + Auth Alignment
- Phase B: Schema + Seed Data
- Phase C: UI Consolidation + Routing
- Phase D: Documentation + Deployment

## Definition of Done (Portfolio Quality)
- All key flows work: login, dashboard, user/software/license CRUD, admin stats, audit log.
- Consistent UI system and design tokens across app.
- Clean, documented README and deployment guide.
- No hard-coded secrets; .env.example provided at repo root.
- Lint/build passes and minimal console noise.
