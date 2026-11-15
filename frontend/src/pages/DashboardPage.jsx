import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { dashboardAPI, licenseAPI, apiErrorMessage } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { formatDate } from '../utils/formatters';
import { Card } from '../components/system/Card';
import { Badge } from '../components/system/Badge';
import { Button } from '../components/system/Button';
import './styles/DashboardPage.css';

// PostgreSQL numeric(20,2) is a decimal string; retain its exact digits.
const money = value => {
  if (typeof value !== 'string' || !/^\d+\.\d{2}$/.test(value)) return 'Unavailable';
  const [whole, cents] = value.split('.');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${cents}`;
};
const cents = value => /^\d+\.\d{2}$/.test(String(value)) ? BigInt(String(value).replace('.', '')) : null;
const dateLabel = value => value && !Number.isNaN(new Date(value).getTime()) ? formatDate(value) : 'Not recorded';
const statusTone = status => status === 'idle' ? 'warning' : status === 'active' ? 'success' : 'neutral';

function Metric({ label, value, note, featured = false }) {
  return <Card className={`sw-dashboard__metric${featured ? ' sw-dashboard__metric--featured' : ''}`}>
    <p className="sw-dashboard__metric-label">{label}</p><p className="sw-dashboard__metric-value">{value}</p>
    <p className="sw-dashboard__metric-note">{note}</p>
  </Card>;
}

function SpendingBreakdown({ items, total }) {
  const totalCents = cents(total);
  return <Card className="sw-dashboard__panel">
    <div className="sw-dashboard__panel-heading"><div><h2>Spending by category</h2><p>Monthly cost of non-pruned licenses</p></div></div>
    {items.length ? <div className="sw-dashboard__breakdown" role="list" aria-label="Monthly spending by category">
      {items.map((item, index) => {
        const amount = cents(item.monthlySpend);
        const width = totalCents && amount !== null && totalCents > 0n ? Number((amount * 10000n) / totalCents) / 100 : 0;
        return <div className="sw-dashboard__bar-row" role="listitem" key={`${item.category ?? 'Uncategorized'}-${index}`}>
          <div className="sw-dashboard__bar-label"><span>{item.category || 'Uncategorized'}</span><strong>{money(item.monthlySpend)} <small>/ month</small></strong></div>
          <div className="sw-dashboard__bar-track" aria-hidden="true"><div style={{ width: `${Math.min(width, 100)}%` }} /></div>
        </div>;
      })}
    </div> : <p className="sw-dashboard__empty">No category spending to show yet.</p>}
  </Card>;
}

function LicenseTable({ title, description, licenses, empty, idle = false }) {
  return <Card className="sw-dashboard__panel sw-dashboard__table-panel">
    <div className="sw-dashboard__panel-heading"><div><h2>{title}</h2><p>{description}</p></div>
      <Link className="sw-dashboard__text-link" to="/licenses">Manage licenses <ArrowRight size={15} aria-hidden="true" /></Link></div>
    {licenses.length ? <><p className="sw-dashboard__table-hint">Scroll horizontally to see all columns.</p><div className="sw-dashboard__table-scroll"><table>
      <thead><tr><th scope="col">Employee</th><th scope="col">Software</th><th scope="col">{idle ? 'Last activity recorded' : 'Assigned'}</th><th scope="col">Status</th><th scope="col" className="sw-dashboard__amount">Monthly cost</th></tr></thead>
      <tbody>{licenses.map(license => <tr key={license.id}>
        <td className="sw-dashboard__name">{license.employeeName || 'Unknown employee'}</td><td>{license.softwareName || 'Unknown software'}</td>
        <td>{dateLabel(idle ? (license.lastActivityDate ?? license.last_active_date) : (license.assignedDate ?? license.assigned_date))}</td>
        <td><Badge tone={statusTone(license.status)}>{license.status || 'Unknown'}</Badge></td>
        <td className="sw-dashboard__amount">{money(license.cost)}</td>
      </tr>)}</tbody>
    </table></div></> : <p className="sw-dashboard__empty">{empty} <Link to="/licenses">Manage licenses</Link>.</p>}
  </Card>;
}

export default function DashboardPage() {
  const { data: metrics, isLoading, error, execute: refreshMetrics } = useAsync(dashboardAPI.getStats);
  const { data: licenses, isLoading: licensesLoading, error: licensesError, execute: refreshLicenses } = useAsync(licenseAPI.getAllLicenses);
  const refresh = () => { void Promise.all([refreshMetrics(), refreshLicenses()]); };
  const rows = Array.isArray(licenses) ? licenses : [];
  const idle = rows.filter(license => license.status === 'idle').slice(0, 5);
  const recent = rows.filter(license => license.assignedDate || license.assigned_date)
    .sort((a, b) => new Date(b.assignedDate ?? b.assigned_date) - new Date(a.assignedDate ?? a.assigned_date)).slice(0, 5);
  const categories = Array.isArray(metrics?.spendingByCategory) ? metrics.spendingByCategory : [];
  return <div className="sw-dashboard">
    <header className="sw-dashboard__header"><div><p className="sw-dashboard__eyebrow">Workspace overview</p><h1>Overview</h1>
      <p className="sw-dashboard__subtitle">Monthly license spending and assignments based on recorded data.</p></div>
      <Button onClick={refresh} loading={isLoading || licensesLoading} aria-label="Refresh dashboard data"><RefreshCw size={16} aria-hidden="true" /> Refresh</Button>
    </header>
    <div className="sw-dashboard__announcements" role="status" aria-live="polite">{(isLoading || licensesLoading) ? 'Loading dashboard data…' : 'Dashboard data loaded.'}</div>
    {error && <div className="sw-dashboard__error" role="alert">Metrics could not be loaded: {apiErrorMessage(error)} <Button onClick={() => void refreshMetrics()}>Retry metrics</Button></div>}
    {licensesError && <div className="sw-dashboard__error" role="alert">Assignments could not be loaded: {apiErrorMessage(licensesError)} <Button onClick={() => void refreshLicenses()}>Retry assignments</Button></div>}
    <section aria-label="Key metrics">{isLoading && !metrics ? <div className="sw-dashboard__metrics" aria-hidden="true">{Array.from({ length: 4 }, (_, i) => <Card className="sw-dashboard__metric sw-dashboard__placeholder" key={i} />)}</div> : metrics && <div className="sw-dashboard__metrics">
      <Metric featured label="Current monthly spending" value={money(metrics.totalSpend)} note="Non-pruned costs · currency not specified by API" />
      <Metric featured label="Estimated potential monthly savings" value={money(metrics.potentialSavings)} note="Cost of licenses currently classified idle" />
      <Metric label="Active licenses" value={metrics.activeLicenseCount ?? '—'} note="Not classified idle or pruned" />
      <Metric label="Idle licenses" value={metrics.idleLicenseCount ?? '—'} note="Review assignments that may be unused" />
    </div>}</section>
    {metrics && <div className="sw-dashboard__details"><SpendingBreakdown items={categories} total={metrics.totalSpend} />
      <Card className="sw-dashboard__panel sw-dashboard__summary"><h2>License summary</h2><p>Additional context for the current portfolio</p>
        <dl><div><dt>Pruned licenses</dt><dd>{metrics.prunedLicenseCount ?? '—'}</dd></div>
          <div><dt>Idle share of spending</dt><dd>{/^\d+\.\d{2}$/.test(String(metrics.savingsPercentage)) ? `${metrics.savingsPercentage}%` : 'Unavailable'}</dd></div>
          <div><dt>Software products</dt><dd>{metrics.totalSoftware ?? '—'}</dd></div></dl></Card></div>}
    {licensesLoading && !licenses ? <p className="sw-dashboard__loading">Loading assignments…</p> : !licensesError && <div className="sw-dashboard__tables">
      <LicenseTable title="Idle licenses" description="Assignments currently classified idle; activity dates are manually recorded." licenses={idle} idle empty="No idle licenses found." />
      <LicenseTable title="Recent assignments" description="Latest assignments by recorded assignment date." licenses={recent} empty="No dated assignments found yet." />
    </div>}
  </div>;
}
