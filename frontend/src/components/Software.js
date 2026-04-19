import React, { useEffect, useState } from 'react';
import api from '../services/api';

// Software page component - displays list of software in a table
function Software() {
  // State to store the list of software from API
  const [software, setSoftware] = useState([]);
  
  // State to track if data is being fetched
  const [loading, setLoading] = useState(true);
  
  // State to store error message if API call fails
  const [error, setError] = useState(null);

  // useEffect runs once when component mounts (empty dependency array)
  // This is where we fetch software data from the backend API
  useEffect(() => {
    const fetchSoftware = async () => {
      try {
        // Make GET request to /software endpoint
        const response = await api.get('/software');
        
        // Extract the software array from response.data.data
        setSoftware(response.data.data);
        setError(null);
      } catch (err) {
        // If request fails, store the error message
        setError(`Failed to load software: ${err.message}`);
        console.error('Software API error:', err);
      } finally {
        // After request completes (success or failure), set loading to false
        setLoading(false);
      }
    };

    // Call the async function to fetch software
    fetchSoftware();
  }, []); // Empty dependency array means this runs only once on mount

  // Show loading state
  if (loading) {
    return <div style={pageStyles.container}>Loading software...</div>;
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
        <h1 style={pageStyles.title}>Software</h1>
        <p style={pageStyles.subtitle}>
          Track and manage your SaaS applications and their pricing.
        </p>
      </div>

      {/* Software Table Card */}
      <div style={pageStyles.card}>
        {software.length > 0 ? (
          <div style={pageStyles.tableWrapper}>
            <table style={pageStyles.table}>
              <thead>
                <tr style={pageStyles.tableHeaderRow}>
                  <th style={pageStyles.tableHeader}>Name</th>
                  <th style={pageStyles.tableHeader}>Category</th>
                  <th style={pageStyles.tableHeader}>Price per Seat</th>
                </tr>
              </thead>
              <tbody>
                {/* Loop through software and display each row */}
                {software.map((item, index) => (
                  <tr 
                    key={item.id} 
                    style={{
                      ...pageStyles.tableRow,
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                    }}
                  >
                    <td style={pageStyles.tableCell}>{item.name}</td>
                    <td style={pageStyles.tableCell}>{item.category}</td>
                    <td style={pageStyles.tableCell}>
                      {/* Format price as currency with $ sign */}
                      ${parseFloat(item.price_per_seat).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Show empty state if no software found
          <p style={pageStyles.emptyMessage}>
            No software found. Add your first software application to get started.
          </p>
        )}
      </div>

      {/* Software count */}
      {software.length > 0 && (
        <p style={pageStyles.softwareCount}>
          Total: {software.length} application{software.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

// Styles object for Software page
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
  emptyMessage: {
    color: '#94a3b8',
    fontSize: '14px',
    margin: 0,
    textAlign: 'center',
    padding: '40px 20px',
  },
  softwareCount: {
    marginTop: '16px',
    fontSize: '12px',
    color: '#94a3b8',
    margin: '16px 0 0 0',
  },
};

export default Software;
