import { useEffect, useState } from 'react';
import api from '../services/api';

function Dashboard() {
  // State to store dashboard data from the API
  const [dashboardData, setDashboardData] = useState(null);
  
  // State to track loading status while fetching data
  const [loading, setLoading] = useState(true);
  
  // State to store error messages if something goes wrong
  const [error, setError] = useState(null);

  // useEffect hook runs once when component mounts (empty dependency array [])
  // This is where we fetch data from the API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Make GET request to /dashboard endpoint
        const response = await api.get('/dashboard');
        
        // Extract data from response and store in state
        setDashboardData(response.data.data);
        
        // Clear any previous errors
        setError(null);
      } catch (err) {
        // If request fails, store the error message
        setError(`Failed to load dashboard: ${err.message}`);
        
        // Log full error for debugging
        console.error('Dashboard API error:', err);
      } finally {
        // After request completes (success or failure), stop loading
        setLoading(false);
      }
    };

    // Call the async function to fetch data
    fetchDashboardData();
  }, []);

  // While data is being fetched, show loading message
  if (loading) {
    return <div className="dashboard"><p>Loading...</p></div>;
  }

  // If there's an error, display error message
  if (error) {
    return <div className="dashboard"><p style={{ color: 'red' }}>{error}</p></div>;
  }

  // If no data received, show message
  if (!dashboardData) {
    return <div className="dashboard"><p>No data available</p></div>;
  }

  // Destructure data from state for easier access in JSX
  const { totalSpend, potentialSavings, activeLicenses, idleUsers } = dashboardData;

  return (
    <div className="dashboard">
      {/* Key Metrics Section */}
      <div className="metrics-container">
        <h2>Dashboard Overview</h2>

        {/* Total Spend Card */}
        <div className="metric-card">
          <h3>Total Spend</h3>
          <p className="metric-value">
            ${totalSpend ? totalSpend.toFixed(2) : '0.00'}
          </p>
          <p className="metric-label">Active licenses</p>
        </div>

        {/* Potential Savings Card */}
        <div className="metric-card">
          <h3>Potential Savings</h3>
          <p className="metric-value" style={{ color: '#27ae60' }}>
            ${potentialSavings ? potentialSavings.toFixed(2) : '0.00'}
          </p>
          <p className="metric-label">From unused licenses</p>
        </div>

        {/* Active Licenses Card */}
        <div className="metric-card">
          <h3>Active Licenses</h3>
          <p className="metric-value">
            {activeLicenses || '0'}
          </p>
          <p className="metric-label">In use</p>
        </div>
      </div>

      {/* Idle Users Section */}
      <div className="idle-users-container">
        <h2>Idle Users ({idleUsers ? idleUsers.length : 0})</h2>
        
        {idleUsers && idleUsers.length > 0 ? (
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Idle Licenses</th>
              </tr>
            </thead>
            <tbody>
              {/* Loop through idle users and display each user's info */}
              {idleUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.idleCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No idle users found - all licenses are in active use!</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
