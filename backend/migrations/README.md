# Employee migration (002)

`users` remains the authentication-account table. `employees` stores license
assignees without credentials. On an existing complete legacy schema, the
runner records migrations 000 and 001 as a baseline, then applies 002 in a
single transaction. It refuses a partial legacy schema. Every old account is
copied to an employee with the same ID before license references are moved.
Account deletion then clears `employees.account_id` and retains employees and
licenses. Employee deletion is restricted while licenses reference it.

Before applying this to a database, take and verify a full database backup,
confirm the target is an isolated fixture or an approved maintenance target,
and inspect the actual schema and row counts. Do not point `DATABASE_URL` at
a production or shared database for local testing. Run `npm run migrate` only
after that review. A second run skips recorded migrations.

Rollback **before** new employees or licenses are written: restore the verified
pre-migration backup. Once credential-free employees exist, the old schema
cannot represent them, so a reverse SQL migration would lose data. Stop the
application and restore from a suitable backup or prepare a reviewed forward
repair; do not drop the employee table to roll back.

The legacy `migrate.js` and fixed-credential demo seed are disabled. To create
the first admin in a fresh local database, supply your own
`ADMIN_BOOTSTRAP_NAME`, `ADMIN_BOOTSTRAP_EMAIL`, and
`ADMIN_BOOTSTRAP_PASSWORD` (at least 12 characters), then run
`npm run seed:admin`. The script refuses to promote an existing account or
create a second admin.

## Isolated PostgreSQL integration test (Windows)

Run `npm run test:integration:postgres` from `backend`. The script uses the
locally installed PostgreSQL 18 binaries to initialize a new cluster in a
uniquely named directory under `%TEMP%`, listens on `127.0.0.1` at an available
port, and creates three uniquely named test databases. It generates a temporary
SCRAM password outside the repository and sets `DATABASE_URL` only for the test
process. The test verifies the connected server's data directory, port, address,
database name, and empty schema before the migration runner executes. The test
does not use `DATABASE_URL` from project `.env` files or contact the existing
PostgreSQL service.

The script stops its cluster afterward and retains the temp directory and all
databases for inspection; it does not issue `DROP DATABASE`, `DROP SCHEMA`, or
`TRUNCATE`. This test is Windows specific and expects PostgreSQL 18 at
`C:\Program Files\PostgreSQL\18\bin`. No demo seed script is run.

Migration 002 replaces `licenses.user_id` with `employee_id` and drops the old
column after copying its values. The migration is transactional, but it takes
table locks and should only be applied to a reviewed target after a verified
backup. The legacy baseline checks table and key column presence, not every
old constraint or index; inspect nonstandard legacy schemas before migration.
