# Development demo seed

`npm run seed:demo` previews a fixed, synthetic SeatWatch dataset. It only targets a
locally running PostgreSQL `seatwatch_dev` database owned and accessed as
`seatwatch_user`, with `NODE_ENV=development`, migrations 000–003 recorded, the
expected employee/license schema, and at least one existing administrator.
It verifies the server's reported loopback address and port, then checks that
both the backend process ID and local TCP listener belong to the same local
`postgres.exe`. This rejects a loopback SSH tunnel or remote proxy. This
Windows-specific check is required because the application role cannot read
PostgreSQL's restricted `data_directory` setting.
The backend's `DATABASE_URL` is loaded through `config/db.js`. The script does
not print its password.

From `backend`:

```powershell
npm run seed:demo
npm run seed:demo -- --apply --database=seatwatch_dev
```

Review the dry-run report before running the second command. The apply command
requires both flags. All inserts use parameters in one transaction. Repeated
runs leave existing demo rows and lifecycle states untouched. The seed uses
`[SeatWatch Demo 08D]` product and employee name markers and reserved
`seatwatch-demo-08d-employee-NN@example.com` addresses. Matching identifiers
with unexpected attributes or license history cause a refusal. Do not manually
reuse these identifiers. Existing employees, software, licenses, users, and
administrator credentials are never updated or deleted. No accounts are made.

The fixture adds 20 fictional employees, 8 illustrative software products, and
35 unique employee/product assignments: 18 active with recent activity, 12
idle at or beyond 30 elapsed days, and 5 pruned with retained history. Three
active rows use the schema's default assignment-time activity. The existing
`last_active_date` column is NOT NULL, so genuinely unknown/null activity
cannot be seeded. One idle row starts at the exact 30-day boundary; subsequent
query time is later, so it remains idle. Dates are relative only when a row is
first inserted. Reruns do not refresh dates or reset pruning.

Prices are illustrative monthly per-seat amounts, not vendor quotes or bills.
The dataset includes a zero-price product and a high-price product. Dashboard
monthly spend sums active and idle seats; potential savings sums idle seats.
Pruned seats are excluded from both. Potential savings are estimates, not
confirmed usage or realized savings. Assigned employees and products with
license history cannot be deleted through the application.
For an otherwise empty catalog, the initial fixture yields estimated monthly
spend of `676.00` and potential monthly savings of `246.00` in the application's
currency-neutral numeric fields. Existing records will add to those totals.

Never run this script against production. Its local identity checks are a
defense in depth measure, and its data is designed only for development demos.
The isolated test runner is `powershell.exe -NoProfile -ExecutionPolicy Bypass
-File scripts/runDemoSeedIntegration.ps1`; it creates a separate temporary
PostgreSQL cluster and leaves its files for inspection.
