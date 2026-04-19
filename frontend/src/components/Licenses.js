import React, { useEffect, useState } from 'react';
import api from '../services/api';

// Licenses page component - displays list of licenses with user and software details
function Licenses() {
  // State to store the list of licenses from API
  const [licenses, setLicenses] = useState([]);
  
  // State to store users data (for mapping user_id to user name)
  const [users, setUsers] = useState([]);
  
  // State to store software data (for mapping software_id to software name)
  const [software, setSoftware] = useState([]);
  
  // State to track if data is being fetched
  const [loading, setLoading] = useState(true);
  
  // State to store error message if API call fails
  const [error, setError] = useState(null);

  // useEffect runs once when component mounts (empty dependency array)
  // This is where we fetch licenses, users, and software from the backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all three endpoints in parallel using Promise.all
        // This is more efficient than fetching them one by one
        const [licensesRes, usersRes, softwareRes] = await Promise.all([
          api.get('/licenses'),
          api.get('/users'),
          api.get('/software'),
        ]);
        
        // Extract and store the data from responses
        setLicenses(licensesRes.data.data);
        setUsers(usersRes.data.data);
        setSoftware(softwareRes.data.data);
        setError(null);
      } catch (err) {
        // If any request fails, store the error message
        setError(`Failed to load licenses: ${err.message}`);
        console.error('Licenses API error:', err);
      } finally {
        // After all requests complete (success or failure), set loading to false
        setLoading(false);
      }
    };

    // Call the async function to fetch data
    fetchData();
  }, []); // Empty dependency array means this runs only once on mount

  // Helper function to format date string to readable format
  // Input: "2026-03-10" → Output: "Mar 10, 2026"
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Helper function to get user name by user_id
  // This maps the user_id from license to the actual user object
  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  // Helper function to get software name by software_id
  // This maps the software_id from license to the actual software object
  const getSoftwareName = (softwareId) => {
    const soft = software.find((s) => s.id === softwareId);
    return soft ? soft.name : 'Unknown Software';
  };

  // Helper function to get status badge style
  // Returns different colors based on status (active = green, idle = red)
  const getStatusStyle = (status) => {
    if (status === 'active') {
      return {
        backgroundColor: '#dcfce7',
        color: '#16a34a',
      };
    } else if (status === 'idle') {
      return {
        backgroundColor: '#fee2e2',
        color: '#dc2626',
      };
    }
    return {
      backgroundColor: '#f1f5f9',
      color: '#64748b',
    };
  };

  // Show loading state
  if (loading) {
    return <div style={pageStyles.container}>Loading licenses...</div>;
  }

  // Show error state
  if (error) {
    return (
      <div style={pageStyles.container}>
        <p style={{ color: '#dc2626' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={pageStyles.container}>
      {/* Section title and description */}
      <div style={pageStyles.header}>
        <h1 style={pageStyles.title}>Licenses</h1>
        <p style={pageStyles.subtitle}>
          View and manage all software licenses across your organization.
        </p>
      </div>

      {/* Licenses Table Card */}
      <div style={pageStyles.card}>
        {licenses.length > 0 ? (
          <div style={pageStyles.tableWrapper}>
            <table style={pageStyles.table}>
              <thead>
                <tr style={pageStyles.tableHeaderRow}>
                  <th style={pageStyles.tableHeader}>User Name</th>
                  <th style={pageStyles.tableHeader}>Software Name</th>
                  <th style={pageStyles.tableHeader}>Last Active Date</th>
                  <th style={pageStyles.tableHeader}>Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Loop through licenses and display each row */}
                {licenses.map((license, index) => (
                  <tr 
                    key={license.id} 
                    style={{
                      ...pageStyles.tableRow,
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                    }}
                  >
                    {/* Get user name using helper function */}
                    <td style={pageStyles.tableCell}>
                      {getUserName(license.user_id)}
                    </td>
                    
                    {/* Get software name using helper function */}
                    <td style={pageStyles.tableCell}>
                      {getSoftwareName(license.software_id)}
                    </td>
                    
                    {/* Format last active date to readable format */}
                    <td style={pageStyles.tableCell}>
                      {formatDate(license.last_active_date)}
                    </td>
                    
                    {/* Status badge with color coding */}
                    <td style={pageStyles.tableCell}>
                      <span 
                        style={{
                          ...pageStyles.statusBadge,
                          ...getStatusStyle(license.status),
                        }}
                      >
                        {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Show empty state if no licenses found
          <p style={pageStyles.emptyMessage}>
            No licenses found. Assign licenses to get started.
          </p>
        )}
      </div>

      {/* License count */}
      {licenses.length > 0 && (
        <p style={pageStyles.licenseCount}>
          Total: {licenses.length} license{licenses.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

// Styles object for Licenses page
const pageStyles = {
  container: {
    padding: '30px',
  },
  header: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.6',
    margin: 0,
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '24px',
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
    padding: '12px 16px',
    fontWeight: '600',
    fontSize: '12px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'all 0.2s ease',
  },
  tableCell: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#1e293b',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  emptyMessage: {
    color: '#94a3b8',
    fontSize: '14px',
    margin: 0,
    textAlign: 'center',
    padding: '40px 20px',
  },
  licenseCount: {
    marginTop: '16px',
    fontSize: '12px',
    color: '#94a3b8',
    margin: '16px 0 0 0',
  },
};

export default Licenses;
