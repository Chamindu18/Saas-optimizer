import React from 'react';

// Navbar component for page header
// Props: title - page title to display
function Navbar({ title = 'Dashboard' }) {
  const navbarStyles = {
    navbar: {
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '28px 30px',
      marginBottom: '32px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
    },
    title: {
      fontSize: '26px',
      fontWeight: '700',
      color: '#1e293b',
      margin: 0,
      letterSpacing: '-0.5px',
    },
  };

  return (
    <div style={navbarStyles.navbar}>
      <h1 style={navbarStyles.title}>{title}</h1>
    </div>
  );
}

export default Navbar;
