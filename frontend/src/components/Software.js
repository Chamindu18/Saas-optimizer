import React from 'react';

// Software page placeholder component
function Software() {
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
      <h1 style={pageStyles.title}>Software</h1>
      <p style={pageStyles.description}>
        Track and manage your SaaS applications and their pricing.
      </p>
    </div>
  );
}

export default Software;
