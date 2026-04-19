import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatCard from './StatCard';

// Dashboard component - displays analytics and idle users
function Dashboard() {
  // State to store dashboard metrics from API
  const [dashboardData, setDashboardData] = useState(null);
  
  // State to track if data is being fetched
  const [loading, setLoading] = useState(true);
  
  // State to store error message if API call fails
  const [error, setError] = useState(null);

  // State for hover effect on users section
  const [isUsersCardHovered, setIsUsersCardHovered] = useState(false);

  // useEffect runs once when component mounts (empty dependency array)
  // This is where we fetch dashboard data from the backend API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Make GET request to /dashboard endpoint
        const response = await api.get('/dashboard');
        
        // Extract the data nested in response.data.data
        setDashboardData(response.data.data);
        setError(null);
      } catch (err) {
        // If request fails, store the error message
        setError(`Failed to load dashboard: ${err.message}`);
        console.error('Dashboard API error:', err);
      } finally {
        // After request completes (success or failure), set loading to false
        setLoading(false);
      }
    };

    // Call the async function
    fetchDashboardData();
  }, []); // Empty dependency array means this runs only once on mount

  // Show loading state
  if (loading) {
    return <div style={dashboardStyles.loadingContainer}>Loading dashboard...</div>;
  }

  // Show error state
  if (error) {
    return <div style={{ ...dashboardStyles.errorContainer, color: '#dc2626' }}>{error}</div>;
  }

  // Show no data message if response is empty
  if (!dashboardData) {
    return <div style={dashboardStyles.emptyContainer}>No dashboard data available</div>;
  }

  // Destructure data for easier access in JSX
  const { totalSpend, potentialSavings, activeLicenses, idleUsers } = dashboardData;

  return (
    <div style={dashboardStyles.container}>
      {/* Metrics Cards Section */}
      <div style={dashboardStyles.statsGrid}>
        <StatCard 
          title="Total Spend" 
          value={`$${totalSpend ? totalSpend.toFixed(2) : '0.00'}`}
          subtitle="Active licenses"
          color="blue"
        />
        <StatCard 
          title="Potential Savings" 
          value={`$${potentialSavings ? potentialSavings.toFixed(2) : '0.00'}`}
          subtitle="From unused licenses"
          color="green"
        />
        <StatCard 
          title="Active Licenses" 
          value={activeLicenses || '0'}
          subtitle="In use"
          color="purple"
        />
      </div>

      {/* Idle Users Section with Hover Effect */}
      <div
        style={{
          ...dashboardStyles.usersSection,
          ...(isUsersCardHovered && dashboardStyles.usersSectionHover),
        }}
        onMouseEnter={() => setIsUsersCardHovered(true)}
        onMouseLeave={() => setIsUsersCardHovered(false)}
      >
        <h2 style={dashboardStyles.sectionTitle}>
          Idle Users ({idleUsers ? idleUsers.length : 0})
        </h2>

        {idleUsers && idleUsers.length > 0 ? (
          <div style={dashboardStyles.tableWrapper}>
            <table style={dashboardStyles.table}>
              <thead>
                <tr style={dashboardStyles.tableHeaderRow}>
                  <th style={dashboardStyles.tableHeader}>Name</th>
                  <th style={dashboardStyles.tableHeader}>Email</th>
                  <th style={dashboardStyles.tableHeader}>Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Loop through idle users and display each row */}
                {idleUsers.map((user, index) => (
                  <tr 
                    key={user.id} 
                    style={dashboardStyles.tableRow}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafbfc'}
                  >
                    <td style={dashboardStyles.tableCell}>{user.name}</td>
                    <td style={dashboardStyles.tableCell}>{user.email}</td>
                    <td style={dashboardStyles.tableCell}>
                      <span style={dashboardStyles.statusBadge}>Idle</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={dashboardStyles.emptyMessage}>
            No idle users found - all licenses are in active use!
          </p>
        )}
      </div>
    </div>
  );
}

// Styles object for Dashboard component
const dashboardStyles = {
  container: {
    padding: '32px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  usersSection: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '28px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
  },
  usersSectionHover: {
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 24px 0',
    letterSpacing: '-0.3px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    borderBottom: '2px solid #e2e8f0',
  },
  tableHeader: {
    textAlign: 'left',
    padding: '14px 16px',
    fontWeight: '700',
    fontSize: '11px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    backgroundColor: '#f8fafc',
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.15s ease',
  },
  tableCell: {
    padding: '16px',
    fontSize: '13px',
    color: '#1e293b',
  },
  statusBadge: {
    display: 'inline-block',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: '32px',
    color: '#64748b',
    fontSize: '14px',
  },
  errorContainer: {
    padding: '32px',
    fontSize: '14px',
  },
  emptyContainer: {
    padding: '32px',
    color: '#64748b',
    fontSize: '14px',
  },
  emptyMessage: {
    color: '#94a3b8',
    fontSize: '14px',
    margin: 0,
    textAlign: 'center',
    padding: '40px 20px',
  },
};

export default Dashboard;
