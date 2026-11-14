import React from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, licenseAPI, apiErrorMessage } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { formatCurrency, formatDate } from '../utils/formatters';
import MetricCard from '../components/ui/MetricCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import { SkeletonCard } from '../components/ui/Skeleton';
import '../pages/styles/DashboardPage.css';

export default function DashboardPage() {
  const { data: metrics, isLoading, error } = useAsync(dashboardAPI.getStats);
  const { data: licenses, isLoading: licensesLoading, error: licensesError } = useAsync(licenseAPI.getAllLicenses);
  const recent = [...(licenses || [])].sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date)).slice(0, 5);

  return <div className="dashboard-page">
    <div className="dashboard-header"><div className="dashboard-header-content">
      <h1>Dashboard</h1><p className="dashboard-subtitle">Monthly SaaS spend and licenses</p>
    </div></div>
    <div className="dashboard-content">
      {error && <Alert type="danger" message={apiErrorMessage(error)} />}
      <div className="metrics-grid">
        {isLoading ? <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></> : metrics && <>
          <MetricCard label="Monthly Spend" value={formatCurrency(metrics.totalSpend)} />
          <MetricCard label="Active Licenses" value={metrics.activeLicenseCount} />
          <MetricCard label="Idle Licenses" value={metrics.idleLicenseCount} />
          <MetricCard label="Pruned Licenses" value={metrics.prunedLicenseCount} />
          <MetricCard label="Estimated Monthly Savings" value={formatCurrency(metrics.potentialSavings)} />
          <MetricCard label="Software Products" value={metrics.totalSoftware} />
        </>}
      </div>
      {metrics?.idleLicenseCount > 0 && <Alert type="warning" title="Idle licenses detected"
        message={`${metrics.idleLicenseCount} licenses are idle. Estimated monthly savings: ${formatCurrency(metrics.potentialSavings)}.`}
        action={<Link to="/licenses">Review licenses</Link>} />}
      <Card className="licenses-section"><div className="card-header"><h2>Recent Licenses</h2><Link to="/licenses">View all</Link></div>
        {licensesError && <Alert type="danger" message={apiErrorMessage(licensesError)} />}
        {licensesLoading ? <p>Loading licenses...</p> : recent.length ? <div className="table-wrapper"><table className="licenses-table">
          <thead><tr><th>Software</th><th>Employee</th><th>Status</th><th>Monthly Cost</th><th>Last Activity</th></tr></thead>
          <tbody>{recent.map(license => <tr key={license.id}>
            <td>{license.softwareName}</td><td>{license.employeeName}</td>
            <td><Badge variant={license.status}>{license.status}</Badge></td>
            <td>{formatCurrency(license.cost)}</td>
            <td>{license.last_active_date ? formatDate(license.last_active_date) : 'No activity recorded'}</td>
          </tr>)}</tbody>
        </table></div> : !licensesError && <p>No licenses assigned yet. <Link to="/licenses">Assign a license</Link>.</p>}
      </Card>
    </div>
  </div>;
}
