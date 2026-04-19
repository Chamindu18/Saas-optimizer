import React from 'react';

// Users page placeholder component
function Users() {
  const pageStyles = {
    container: {
      padding: '30px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '20px',
    },
    description: {
      fontSize: '14px',
      color: '#64748b',
      lineHeight: '1.6',
    },
  };

  return (
    <div style={pageStyles.container}>
      <h1 style={pageStyles.title}>Users</h1>
      <p style={pageStyles.description}>
        Manage your organization's users and their license assignments.
      </p>
    </div>
  );
}

export default Users;
