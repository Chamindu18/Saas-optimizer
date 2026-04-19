import React from 'react';

// Navbar component for page header
// Props: title - page title to display
function Navbar({ title = 'Dashboard' }) {
  const navbarStyles = {
    navbar: {
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '20px 30px',
      marginBottom: '30px',
    },
    title: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#1e293b',
      margin: 0,
    },
  };

  return (
    <div style={navbarStyles.navbar}>
      <h1 style={navbarStyles.title}>{title}</h1>
    </div>
  );
}

export default Navbar;
