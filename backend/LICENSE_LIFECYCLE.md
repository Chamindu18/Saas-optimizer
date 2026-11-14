# License lifecycle and financial definitions

`licenses.employee_id` identifies the assignee. An employee/software pair is
unique across all states. A duplicate assignment returns 409, including when
the existing row is pruned. Reassignment to a different employee is not
supported by the license API: retain the old row and create a separate
assignment for the new employee. The current schema cannot represent multiple
historical periods for the same employee/software pair. That limitation needs
a separate product and migration decision before changing the uniqueness rule.

The authoritative classification uses `last_active_date` and PostgreSQL
`CURRENT_TIMESTAMP`. An assigned, unpruned seat is idle at or beyond exactly
30 elapsed 24-hour days since its last recorded activity. Comparisons are of
`TIMESTAMPTZ` instants and do not depend on the server or client timezone.
Recent activity is active. A null or future value is treated as unknown and
therefore active for reads; the API rejects null, invalid, or future updates.
The schema currently requires non-null activity and defaults new assignments
to their assignment time. SeatWatch has no external usage feed; activity dates
are manually supplied and should not be presented as live SaaS telemetry.

Pruned rows remain pruned through reads and scheduled checks. An admin may
explicitly reactivate through `PUT /api/licenses/:id` with
`{"status":"active","last_active_date":"<recent ISO timestamp>"}`.
Managers may update a non-pruned activity date. `idle` is calculated, and the
admin-only prune endpoint is the only deactivation action. Deleting a license
returns 409; deleting software with any license history also returns 409.
Employee deletion remains restricted while any license references it.
The scheduled check reconciles stored active/idle status in one conditional
database update. Reads project the same classification without writes, so
reports stay current between checks. Repeated and concurrent checks only
write changed rows.

`software.price_per_seat` is interpreted as an **estimated monthly** recurring
amount per seat, using the current recorded price. This interpretation follows
the existing monthly dashboard contract; the schema has no billing period,
currency, historical prices, or invoice data. Current monthly spending sums
active and idle seats, excluding pruned seats. Estimated potential monthly
savings sums idle seats only. It is not realized savings or evidence that a
vendor stopped billing. The idle spend percentage is potential savings divided
by current monthly spending, or zero for zero spend. PostgreSQL `NUMERIC`
performs sums and rounds percentages to two decimal places. JSON monetary
amounts and percentages are fixed two-decimal strings to preserve exactness.
Category spending is grouped by the software category and excludes pruned
seats. A zero-price seat still counts toward its lifecycle state.

The existing dashboard field names remain available. Metrics add
`prunedLicenseCount` and `spendingByCategory`; `/api/dashboard` adds idle and
pruned counts and the idle spend percentage. `/api/admin/stats` now returns
`potentialSavings` instead of the misleading `savingsRealized`. The existing
frontend currency formatter accepts decimal strings. `DELETE /api/licenses/:id`
now returns 409 for existing rows, and the frontend revoke action calls the
prune endpoint. No API claims confirmed billing cancellation.
