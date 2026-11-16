# SeatWatch project status

Updated: 2026-11-16, Task 09C review. This is a portfolio MVP status, not a production security certification.

## Implemented

- React 19 / Vite 7 frontend with responsive public, authentication, dashboard, employee, software, license, and administration routes.
- Express / PostgreSQL API with migrations 000–003, account and employee separation, JWT authentication, server-side Viewer/Manager/Admin authorization, and administrator-controlled account provisioning. Public registration is disabled.
- Active, idle, and pruned license lifecycle. Idle classification uses 30 elapsed days from application-recorded activity. Spending and potential savings are estimates from stored seat prices, without a verified currency or provider synchronization.
- Secure first-administrator bootstrap with explicit variables and a development-only synthetic inventory seed that previews changes by default.
- Login throttling of 10 failed requests per client IP per 15 minutes, with explicit trusted proxy CIDRs.

## Verified through Task 09B

Backend unit tests: 34/34; isolated PostgreSQL integration and demo seed safety: passed; frontend unit tests: 57/57; production build: passed; comprehensive application browser QA: 41/41. Landing and authentication QA passed at 390, 768, 1024, 1440, and 1680 px.

Task 09C repeated these suites successfully. Application browser QA passed 42/42 checks after adding a login keyboard order, focus, and validation-announcement check; dedicated landing and authentication QA also passed at all five widths. These results cover tested local fixtures and flows only.

## Remaining risks and review gaps

- Complete keyboard traversal, contrast, zoom/reflow, and actual screen-reader usability have not been established by the existing QA suite. Automated semantic checks cannot substitute for a real screen reader.
- Browser-held JWTs create XSS-related session exposure risk. Review the seven-day token lifetime and session response for the intended deployment.
- The login limiter is process-local and resets on restart; multi-instance use needs a shared store. Proxy IP handling and forwarded headers require verification in the real hosting path.
- Audit logging is best effort and is not an immutable or complete compliance trail.
- The backend dependency audit has reported moderate `node-cron` → `uuid` advisories. Recheck the exact installed tree before release; a node-cron upgrade requires scheduling compatibility review.
- The application is a shared organizational workspace. It has no tenant isolation, provider activity sync, subscription cancellation, invoice verification, or realized-savings measurement.

## Task 09D: deployment readiness

Choose and review hosting topology; configure HTTPS, secrets, PostgreSQL connectivity and backups, frontend API origin/CORS, reverse proxy CIDRs, and production logging. Review JWT/session and rate limiting for that topology. Apply migrations to a reviewed target, bootstrap privately, and run production smoke and accessibility checks. Do not infer production readiness from the disposable local harness.

## Deferred enhancements

Potential future work includes a shared rate-limit store, stronger session management, account recovery, vendor integrations, currency modeling, and tenant isolation. None is implemented or required for the current portfolio MVP.
