import React from 'react';

// Sidebar component for navigation
// Props: 
//   activePage - current active page (dashboard, users, software, licenses)
//   setActivePage - function to change active page
function Sidebar({ activePage = 'dashboard', setActivePage }) {
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
      padding: '24px 0',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      overflowY: 'auto',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    },
    brand: {
      padding: '0 20px 24px 20px',
      borderBottom: '1px solid #e2e8f0',
      marginBottom: '24px',
    },
    brandText: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1e293b',
      margin: 0,
      letterSpacing: '-0.5px',
    },
    navContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      paddingX: '8px',
    },
    navItem: {
      padding: '11px 20px',
      cursor: 'pointer',
      color: '#64748b',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      borderLeft: '4px solid transparent',
      userSelect: 'none',
      margin: '0 8px',
      borderRadius: '6px',
    },
    navItemActive: {
      borderLeft: '4px solid #2563eb',
      backgroundColor: '#dbeafe',
      color: '#2563eb',
      margin: '0 8px',
      borderRadius: '6px',
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
            // onClick handler to change the active page when user clicks
            onClick={() => setActivePage(item.key)}
            // Apply active style if this item matches activePage
            style={{
              ...sidebarStyles.navItem,
              ...(activePage === item.key ? sidebarStyles.navItemActive : {}),
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
