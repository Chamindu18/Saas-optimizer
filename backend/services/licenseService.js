import pool from '../config/db.js';
import LicenseModel from '../models/License.js';
import SoftwareModel from '../models/Software.js';
import { getEmployee } from '../models/Employee.js';
import { effectiveStatus, validId, validActivityDate, httpError } from './licenseRules.js';

const getAllLicenses = () => LicenseModel.getAllLicenses();
const getLicenseById = (id) => {
  if (!validId(id)) throw httpError(400, 'Valid license ID required');
  return LicenseModel.getLicenseById(Number(id));
};
const assignLicense = async ({ employee_id, software_id }) => {
  if (!validId(employee_id) || !validId(software_id))
    throw httpError(400, 'Valid employee and software IDs are required');
  if (!await getEmployee(Number(employee_id))) throw httpError(404, 'Employee not found');
  if (!await SoftwareModel.getSoftwareById(Number(software_id))) throw httpError(404, 'Software not found');
  return LicenseModel.createLicense({ employee_id: Number(employee_id), software_id: Number(software_id) });
};
const updateLicense = async (id, data, role) => {
  if (!validId(id)) throw httpError(400, 'Valid license ID required');
  if (!data || !Object.keys(data).length || Object.keys(data).some(k => !['status', 'last_active_date'].includes(k)))
    throw httpError(400, 'Only status and last_active_date may be updated');
  if (data.status !== undefined && data.status !== 'active')
    throw httpError(400, 'Use prune to deactivate; idle status is calculated');
  if (data.last_active_date !== undefined && !validActivityDate(data.last_active_date))
    throw httpError(400, 'A valid non-future ISO activity timestamp is required');
  if (data.status === 'active' && role !== 'admin')
    throw httpError(403, 'Only admins may explicitly reactivate a license');
  const result = await pool.query(`UPDATE licenses SET
      last_active_date = COALESCE($2::timestamptz, last_active_date),
      status = CASE WHEN $3::boolean THEN 'active' ELSE status END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND (NOT $3::boolean OR COALESCE($2::timestamptz, last_active_date) > CURRENT_TIMESTAMP - INTERVAL '30 days')
      AND (status <> 'pruned' OR ($3::boolean AND $2::timestamptz IS NOT NULL))
    RETURNING *`, [Number(id), data.last_active_date ?? null, data.status === 'active']);
  if (result.rows[0]) return result.rows[0];
  if (!await LicenseModel.getLicenseById(Number(id))) throw httpError(404, 'License not found');
  throw httpError(409, 'Transition requires explicit reactivation with recent activity');
};
const pruneLicense = async (id) => {
  if (!validId(id)) throw httpError(400, 'Valid license ID required');
  const result = await pool.query(`UPDATE licenses SET status = 'pruned', updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND status <> 'pruned' RETURNING *`, [Number(id)]);
  if (result.rows[0]) return result.rows[0];
  const existing = await LicenseModel.getLicenseById(Number(id));
  if (!existing) throw httpError(404, 'License not found');
  return existing;
};
const deleteLicense = async (id) => {
  if (!validId(id)) throw httpError(400, 'Valid license ID required');
  if (!await LicenseModel.getLicenseById(Number(id))) throw httpError(404, 'License not found');
  throw httpError(409, 'License history is retained; prune this license instead');
};
const detectIdleLicenses = () => LicenseModel.getIdleLicenses();
const reconcileIdleStatuses = async () => {
  const result = await pool.query(`UPDATE licenses SET status = ${effectiveStatus}, updated_at = CURRENT_TIMESTAMP
    WHERE status <> 'pruned' AND status <> ${effectiveStatus} RETURNING id`);
  return result.rowCount;
};
const metrics = async () => {
  const { rows: [r] } = await pool.query(`WITH classified AS (
      SELECT ${effectiveStatus} AS status, software.price_per_seat AS price, software.category
      FROM licenses JOIN software ON software.id = licenses.software_id
    ) SELECT
      COUNT(*) FILTER (WHERE status = 'active')::int AS active_count,
      COUNT(*) FILTER (WHERE status = 'idle')::int AS idle_count,
      COUNT(*) FILTER (WHERE status = 'pruned')::int AS pruned_count,
      COALESCE(SUM(price) FILTER (WHERE status <> 'pruned'), 0)::numeric(20,2)::text AS total_spend,
      COALESCE(SUM(price) FILTER (WHERE status = 'idle'), 0)::numeric(20,2)::text AS potential_savings,
      COALESCE(ROUND(100 * SUM(price) FILTER (WHERE status = 'idle') /
        NULLIF(SUM(price) FILTER (WHERE status <> 'pruned'), 0), 2), 0)::numeric(8,2)::text AS savings_percentage
      ,(SELECT COALESCE(jsonb_agg(jsonb_build_object('category', category, 'monthlySpend', spend)
           ORDER BY category), '[]'::jsonb)
        FROM (SELECT category, SUM(price)::numeric(20,2)::text AS spend
          FROM classified WHERE status <> 'pruned' GROUP BY category) categories) AS spending_by_category
    FROM classified`);
  return { activeLicenseCount: r.active_count, idleLicenseCount: r.idle_count,
    prunedLicenseCount: r.pruned_count, totalSpend: r.total_spend,
    potentialSavings: r.potential_savings, savingsPercentage: r.savings_percentage,
    spendingByCategory: r.spending_by_category };
};
const getDashboardData = async () => {
  const m = await metrics();
  return { ...m, activeCount: m.activeLicenseCount,
    metrics: { percentageOfSpendBeingWasted: m.savingsPercentage } };
};
const calculateTotalSpend = async () => {
  const m = await metrics();
  return { totalSpend: m.totalSpend, activeLicenseCount: m.activeLicenseCount };
};
const calculatePotentialSavings = async () => {
  const [m, idleLicenses] = await Promise.all([metrics(), detectIdleLicenses()]);
  return { potentialSavings: m.potentialSavings, idleLicenseCount: m.idleLicenseCount, idleLicenses };
};
export default { getAllLicenses, getLicenseById, assignLicense, updateLicense, pruneLicense,
  deleteLicense, detectIdleLicenses, reconcileIdleStatuses, metrics, getDashboardData,
  calculateTotalSpend, calculatePotentialSavings };
