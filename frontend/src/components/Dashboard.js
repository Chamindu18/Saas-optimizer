import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatCard from './StatCard';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard');
        setDashboardData(response.data.data);
        setError(null);
      } catch (err) {
        setError(`Failed to load dashboard: ${err.message}`);
        console.error('Dashboard API error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ padding: 'var(--spacing-lg)', color: 'var(--color-error)' }}>{error}</div>;
  }

  if (!dashboardData) {
    return <div style={{ padding: 'var(--spacing-lg)', color: 'var(--color-text-secondary)' }}>No dashboard data available</div>;
  }

  const { totalSpend, potentialSavings, activeLicenses, idleUsers } = dashboardData;

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>

      <div className="stat-cards">
        <StatCard 
          title="Total Spend" 
          value={`$${totalSpend ? totalSpend.toFixed(2) : '0.00'}`}
          subtitle="Active licenses"
        />
        <StatCard 
          title="Potential Savings" 
          value={`$${potentialSavings ? potentialSavings.toFixed(2) : '0.00'}`}
          subtitle="From unused licenses"
        />
        <StatCard 
          title="Active Licenses" 
          value={activeLicenses || '0'}
          subtitle="In use"
        />
      </div>

      <div className="card">
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-lg)' }}>
          Idle Users ({idleUsers ? idleUsers.length : 0})
        </h2>

        {idleUsers && idleUsers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {idleUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span style={{ 
                        backgroundColor: 'rgba(201, 168, 76, 0.1)', 
                        color: 'var(--color-accent)',
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)'
                      }}>
                        Idle
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
            No idle users found - all licenses are in active use!
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;