# SeatWatch project status

Updated: 2026-11-16, Task 09E final documentation cleanup. SeatWatch is a locally runnable, GitHub-only portfolio MVP. Cloud deployment is not a completion criterion. This status does not certify production security or accessibility.

## Implemented

- React 19 / Vite 7 frontend with responsive public, authentication, dashboard, employee, software, license, and administration routes.
- Express / PostgreSQL API with migrations 000–003, account and employee separation, JWT authentication, server-side Viewer/Manager/Admin authorization, and administrator-controlled account provisioning. Public registration is disabled.
- Active, idle, and pruned license lifecycle. Idle classification uses 30 elapsed days from application-recorded activity. Spending and potential savings are estimates from stored seat prices, without a verified currency or provider synchronization.
- Secure first-administrator bootstrap with explicit variables and a development-only synthetic inventory seed that previews changes by default.
- Login throttling of 10 failed requests per client IP per 15 minutes, with explicit trusted proxy CIDRs.

## Completed reviews

Backend unit tests: 34/34; isolated PostgreSQL integration and demo seed safety: passed; frontend unit tests: 57/57; production build: passed; comprehensive application browser QA: 41/41. Landing and authentication QA passed at 390, 768, 1024, 1440, and 1680 px.

Tasks 09A and 09A-1 completed the local application and security review work. Task 09C repeated the backend, frontend, PostgreSQL, demo seed, and browser suites. Application browser QA passed 42/42 checks; dedicated landing and authentication QA passed at all five widths. These results cover tested local fixtures and flows only.

Task 09D final audit verdict: **PASS WITH LIMITATIONS**. It confirmed no P0 or P1 application blockers. Its baseline was backend 34/34, frontend 57/57, application browser QA 42/42, passing isolated PostgreSQL and demo seed safety checks, production frontend build, five-width landing/auth QA, 51 Node syntax checks, Markdown links, and `git diff --check`. These are historical audit results, not a claim of fresh execution.

Task 09E is the final planned documentation and repository cleanup. The final Task 09E report records the checks rerun after edits.

## Remaining risks and review gaps

- Complete keyboard traversal, contrast, zoom/reflow, and actual screen-reader usability have not been established by the existing QA suite. Automated semantic checks cannot substitute for a real screen reader.
- Browser-held JWTs create XSS-related session exposure risk. The current token lifetime is seven days.
- The login limiter is process-local and resets on restart; multi-instance use would need a shared store. Proxy IP handling would need verification for any future hosting path.
- Audit logging is best effort and is not an immutable or complete compliance trail.
- The backend dependency audit has reported moderate `node-cron` → `uuid` advisories. Recheck the exact installed tree before release; a node-cron upgrade requires scheduling compatibility review.
- The application is a shared organizational workspace. It has no tenant isolation, provider activity sync, subscription cancellation, invoice verification, or realized-savings measurement.

## Completion boundary

No hosting or cloud deployment is planned. After Task 09E, final working-tree review, confirmation of the generic copyright attribution in `LICENSE`, commit, and GitHub publication remain the owner's manual responsibility. Local commits appearing on remote GitHub have not been independently verified. No further development phase is required for this portfolio MVP.
