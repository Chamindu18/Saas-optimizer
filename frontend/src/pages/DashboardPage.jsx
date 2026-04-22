import React, { useState, useEffect } from 'react';
import PageHeader from '../components/layout/PageHeader';
import MetricCard from '../components/ui/MetricCard';
import AlertBanner from '../components/ui/AlertBanner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SkeletonCard, SkeletonText } from '../components/ui/Skeleton';
import '../pages/styles/DashboardPage.css';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    metrics: {
      monthlySpend: '$47,200',
      potentialSavings: '$9,850',
      totalLicenses: 342,
      activeUsers: 287,
    },
    alerts: {
      idleLicenses: 23,
      show: true,
    },
  });

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="dashboard page-enter">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your SaaS spend and licenses"
        actions={
          <Button variant="primary">
            + Add License
          </Button>
        }
      />

      {/* Alert Banner */}
      {data.alerts.show && (
        <AlertBanner
          variant="danger"
          title={`${data.alerts.idleLicenses} idle licenses detected`}
          message="Review and remove unused seats to reduce spend"
          actionLabel="Review Now"
          onAction={() => console.log('Review idle licenses')}
        />
      )}

      {/* Metric Cards Row */}
      <div className="metrics-grid">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <MetricCard
              label="Monthly Spend"
              value={data.metrics.monthlySpend}
              sub="across 42 subscriptions"
              accentColor="var(--gold)"
              trend="↑ 12% vs last month"
              trendColor="var(--success-text)"
            />
            <MetricCard
              label="Potential Savings"
              value={data.metrics.potentialSavings}
              sub="21% of budget idle"
              accentColor="var(--danger-text)"
              trend="$9.8K/month"
              trendColor="var(--danger-text)"
            />
            <MetricCard
              label="Total Licenses"
              value={data.metrics.totalLicenses}
              sub="seats purchased"
              accentColor="var(--info-text)"
            />
            <MetricCard
              label="Active Users"
              value={data.metrics.activeUsers}
              sub="83% utilization"
              accentColor="var(--success-text)"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <Card className="chart-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Monthly Spend Trend
          </h3>
          {loading ? (
            <SkeletonText lines={3} />
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Chart placeholder — Custom SVG chart to be implemented
            </div>
          )}
        </Card>

        <Card className="chart-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Spend by Category
          </h3>
          {loading ? (
            <SkeletonText lines={3} />
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Donut chart placeholder — Custom SVG chart to be implemented
            </div>
          )}
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <div style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Active Subscriptions
          </h3>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <SkeletonText />
              <SkeletonText />
              <SkeletonText />
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Software</th>
                  <th>Cost</th>
                  <th>Seats</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Slack</td>
                  <td>$12,500/mo</td>
                  <td>125 / 150</td>
                  <td><span style={{ color: 'var(--warning-text)' }}>⚠ 17% idle</span></td>
                </tr>
                <tr>
                  <td>Figma</td>
                  <td>$5,200/mo</td>
                  <td>42 / 50</td>
                  <td><span style={{ color: 'var(--success-text)' }}>✓ Active</span></td>
                </tr>
                <tr>
                  <td>Adobe Creative Cloud</td>
                  <td>$8,900/mo</td>
                  <td>23 / 30</td>
                  <td><span style={{ color: 'var(--warning-text)' }}>⚠ 23% idle</span></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
