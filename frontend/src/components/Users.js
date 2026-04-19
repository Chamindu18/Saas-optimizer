import React, { useEffect, useState } from 'react';
import api from '../services/api';

// Users page component - displays list of users in a table
function Users() {
  // State to store the list of users from API
  const [users, setUsers] = useState([]);
  
  // State to track if data is being fetched
  const [loading, setLoading] = useState(true);
  
  // State to store error message if API call fails
  const [error, setError] = useState(null);

  // State for card hover effect
  const [isCardHovered, setIsCardHovered] = useState(false);

  // useEffect runs once when component mounts (empty dependency array)
  // This is where we fetch users from the backend API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Make GET request to /users endpoint
        const response = await api.get('/users');
        
        // Extract the users array from response.data.data
        setUsers(response.data.data);
        setError(null);
      } catch (err) {
        // If request fails, store the error message
        setError(`Failed to load users: ${err.message}`);
        console.error('Users API error:', err);
      } finally {
        // After request completes (success or failure), set loading to false
        setLoading(false);
      }
    };

    // Call the async function to fetch users
    fetchUsers();
  }, []); // Empty dependency array means this runs only once on mount

  // Show loading state
  if (loading) {
    return <div style={pageStyles.container}>Loading users...</div>;
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
        <h1 style={pageStyles.title}>Users</h1>
        <p style={pageStyles.subtitle}>
          Manage your organization's users and their license assignments.
        </p>
      </div>

      {/* Users Table Card */}
      <div 
        style={{
          ...pageStyles.card,
          ...(isCardHovered && pageStyles.cardHover),
        }}
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => setIsCardHovered(false)}
      >
        {users.length > 0 ? (
          <div style={pageStyles.tableWrapper}>
            <table style={pageStyles.table}>
              <thead>
                <tr style={pageStyles.tableHeaderRow}>
                  <th style={pageStyles.tableHeader}>Name</th>
                  <th style={pageStyles.tableHeader}>Email</th>
                </tr>
              </thead>
              <tbody>
                {/* Loop through users and display each row */}
                {users.map((user, index) => (
                  <tr 
                    key={user.id} 
                    style={pageStyles.tableRow}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafbfc'}
                  >
                    <td style={pageStyles.tableCell}>{user.name}</td>
                    <td style={pageStyles.tableCell}>{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Show empty state if no users found
          <p style={pageStyles.emptyMessage}>
            No users found. Create your first user to get started.
          </p>
        )}
      </div>

      {/* User count */}
      {users.length > 0 && (
        <p style={pageStyles.userCount}>
          Total: {users.length} user{users.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

// Styles object for Users page
const pageStyles = {
  container: {
    padding: '32px',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
    letterSpacing: '-0.3px',
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
    padding: '28px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
  },
  cardHover: {
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px)',
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
  emptyMessage: {
    color: '#94a3b8',
    fontSize: '14px',
    margin: 0,
    textAlign: 'center',
    padding: '40px 20px',
  },
  userCount: {
    marginTop: '20px',
    fontSize: '12px',
    color: '#94a3b8',
  },
};

export default Users;
