// TIMESTAMPTZ compares instants: the 30-day boundary is inclusive.
// Null and future activity remain active because inactivity is unproven.
export const effectiveStatus = `CASE
  WHEN licenses.status = 'pruned' THEN 'pruned'
  WHEN licenses.last_active_date IS NOT NULL
    AND licenses.last_active_date <= CURRENT_TIMESTAMP
    AND licenses.last_active_date <= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 'idle'
  ELSE 'active' END`;

export const validId = (value) => /^(?:[1-9][0-9]*)$/.test(String(value)) &&
  Number.isSafeInteger(Number(value));

export const httpError = (status, message) => Object.assign(new Error(message), { status });

export function validActivityDate(value) {
  if (typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (month < 1 || month > 12 || day < 1 ||
      day > new Date(Date.UTC(year, month, 0)).getUTCDate()) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed <= Date.now();
}
