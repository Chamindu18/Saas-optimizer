import React, { useState, useEffect } from 'react';
import api from '../services/api';
import MetricCard from '../components/ui/MetricCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Alert from '../components/ui/Alert';
import { SkeletonCard } from '../components/ui/Skeleton';
import '../pages/styles/DashboardPage.css';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [idleLicenses, setIdleLicenses] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard metrics
      const metricsResponse = await api.get('/licenses/dashboard/metrics');
      setMetrics(metricsResponse.data.data || metricsResponse.data);

      // Fetch idle licenses
      try {
        const idleResponse = await api.get('/licenses/idle/list');
        setIdleLicenses(idleResponse.data.data?.length || 0);
      } catch (err) {
        console.error('Failed to fetch idle licenses:', err);
      }

      // Fetch recent licenses
      try {
        const licenseResponse = await api.get('/licenses?limit=5');
        setLicenses(licenseResponse.data.data || []);
      } catch (err) {
        console.error('Failed to fetch licenses:', err);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return `$${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { variant: 'active', label: 'Active' },
      idle: { variant: 'idle', label: 'Idle' },
      pruned: { variant: 'pruned', label: 'Pruned' },
    };
    const config = statusMap[status] || statusMap.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div className="dashboard-header-content">
            <h1>Dashboard</h1>
            <p className="dashboard-subtitle">Overview of your SaaS spend and licenses</p>
          </div>
        </div>
        <div className="dashboard-content">
          <Alert type="danger" message={error} />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">Overview of your SaaS spend and licenses</p>
        </div>
      </div>

      <div className="dashboard-content">
        {/* KPI Cards */}
        <div className="metrics-grid">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : metrics ? (
            <>
              <MetricCard
                label="Total Spend"
                value={formatCurrency(metrics.totalSpend || 0)}
                icon="💰"
              />
              <MetricCard
                label="Active Licenses"
                value={metrics.activeCount || 0}
                icon="✓"
              />
              <MetricCard
                label="Idle Licenses"
                value={idleLicenses}
                trendDirection="down"
                icon="⚠️"
              />
              <MetricCard
                label="Potential Savings"
                value={formatCurrency(metrics.potentialSavings || 0)}
                trend={metrics.savingsPercentage || 0}
                trendDirection="up"
                icon="💵"
              />
            </>
          ) : null}
        </div>

        {/* Alerts */}
        {idleLicenses > 0 && (
          <Alert
            type="warning"
            title="Idle Licenses Detected"
            message={`You have ${idleLicenses} license${idleLicenses !== 1 ? 's' : ''} unused for 30+ days. Consider pruning them to reduce costs.`}
            action={
              <Button variant="secondary" size="sm">
                Review
              </Button>
            }
          />
        )}

        {/* Recent Licenses Section */}
        <Card className="licenses-section">
          <div className="card-header">
            <h2>Recent Licenses</h2>
            <Button variant="secondary" size="sm">
              View All
            </Button>
          </div>

          {licenses.length > 0 ? (
            <div className="table-wrapper">
              <table className="licenses-table">
                <thead>
                  <tr>
                    <th>Software</th>
                    <th>User</th>
                    <th>Status</th>
                    <th>Cost</th>
                    <th>Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((license) => (
                    <tr key={license.id}>
                      <td>
                        <div className="table-cell-content">
                          <div className="software-name">{license.softwareName}</div>
                        </div>
                      </td>
                      <td>
                        <div className="table-cell-content">{license.userName}</div>
                      </td>
                      <td>
                        <div className="table-cell-content">
                          {getStatusBadge(license.status)}
                        </div>
                      </td>
                      <td>
                        <div className="table-cell-content">
                          {formatCurrency(license.cost)}
                        </div>
                      </td>
                      <td>
                        <div className="table-cell-content">
                          <time>{new Date(license.lastActivityDate).toLocaleDateString()}</time>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No Licenses"
              description="Start by adding users and software to your workspace."
              icon="📋"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
                  <div className="stat-number">{data.metrics.activeUsers}</div>
                  <div className="stat-label">with assignments</div>
                </div>
              </Card>
            </div>

            {/* Secondary: Quick Stats */}
            <div className="bento-cell">
              <Card className="bento-panel bento-panel-accent">
                <div className="panel-header">Tools</div>
                <div className="stat-box">
                  <div className="stat-number">{data.metrics.totalSoftware}</div>
                  <div className="stat-label">under management</div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
