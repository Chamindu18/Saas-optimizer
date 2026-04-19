import React from 'react';

// Licenses page placeholder component
function Licenses() {
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
      <h1 style={pageStyles.title}>Licenses</h1>
      <p style={pageStyles.description}>
        View and manage all software licenses across your organization.
      </p>
    </div>
  );
}

export default Licenses;
