import pool from '../config/db.js';
import licenseService from './licenseService.js';
import { effectiveStatus } from './licenseRules.js';

const getTotalSpend = async () => ({ totalSpend: (await licenseService.metrics()).totalSpend });
const getPotentialSavings = async () => ({ potentialSavings: (await licenseService.metrics()).potentialSavings });
const getActiveLicenseCount = async () => ({ activeLicenses: (await licenseService.metrics()).activeLicenseCount });
const getIdleUsers = async () => {
  const { rows } = await pool.query(`SELECT employees.id, employees.name, employees.email,
      COUNT(licenses.id)::int AS "idleCount",
      json_agg(json_build_object('softwareId', software.id, 'softwareName', software.name,
        'lastActiveDate', licenses.last_active_date) ORDER BY licenses.id) AS "idleLicenses"
    FROM licenses JOIN employees ON employees.id = licenses.employee_id
      JOIN software ON software.id = licenses.software_id
    WHERE ${effectiveStatus} = 'idle'
    GROUP BY employees.id ORDER BY employees.id`);
  return { idleUsers: rows };
};
const getDashboardData = async () => {
  const [m, { idleUsers }] = await Promise.all([licenseService.metrics(), getIdleUsers()]);
  return { totalSpend: m.totalSpend, potentialSavings: m.potentialSavings,
    activeLicenses: m.activeLicenseCount, idleLicenseCount: m.idleLicenseCount,
    prunedLicenseCount: m.prunedLicenseCount, savingsPercentage: m.savingsPercentage,
    spendingByCategory: m.spendingByCategory, idleUsers };
};
const getLicenseSummary = async () => {
  const m = await licenseService.metrics();
  return { active: m.activeLicenseCount, idle: m.idleLicenseCount, pruned: m.prunedLicenseCount };
};
export default { getTotalSpend, getPotentialSavings, getActiveLicenseCount,
  getIdleUsers, getDashboardData, getLicenseSummary };
