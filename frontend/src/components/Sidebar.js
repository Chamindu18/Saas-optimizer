import React from 'react';

// Sidebar component for navigation
// Props: activeLink - current active page to highlight
function Sidebar({ activeLink = 'dashboard' }) {
  // Array of navigation items with their labels and keys
  const navItems = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'users', label: 'Users' },
    { key: 'software', label: 'Software' },
    { key: 'licenses', label: 'Licenses' },
  ];

  const sidebarStyles = {
    sidebar: {
      width: '250px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      padding: '20px 0',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      overflowY: 'auto',
    },
    brand: {
      padding: '0 20px 30px 20px',
      borderBottom: '1px solid #e2e8f0',
      marginBottom: '20px',
    },
    brandText: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1e293b',
      margin: 0,
    },
    navContainer: {
      display: 'flex',
      flexDirection: 'column',
    },
    navItem: {
      padding: '12px 20px',
      cursor: 'pointer',
      color: '#64748b',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      borderLeft: '4px solid transparent',
    },
    navItemActive: {
      borderLeft: '4px solid #2563eb',
      backgroundColor: '#eff6ff',
      color: '#2563eb',
    },
  };

  return (
    <div style={sidebarStyles.sidebar}>
      {/* Brand/Logo Section */}
      <div style={sidebarStyles.brand}>
        <h2 style={sidebarStyles.brandText}>SaaS Manager</h2>
      </div>

      {/* Navigation Items */}
      <nav style={sidebarStyles.navContainer}>
        {navItems.map((item) => (
          <div
            key={item.key}
            style={{
              ...sidebarStyles.navItem,
              ...(activeLink === item.key ? sidebarStyles.navItemActive : {}),
            }}
          >
            {item.label}
          </div>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
