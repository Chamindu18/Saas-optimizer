import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';

/**
 * Sidebar Component
 * 
 * Navigation sidebar for authenticated app
 * Shows nav items and current user info
 * 
 * Props:
 *   - activePage: Current active page ('dashboard', 'users', 'software', 'licenses')
 */
function Sidebar({ activePage = 'dashboard' }) {
  const navigate = useNavigate();

  // Array of navigation items with their labels and routes
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { key: 'users', label: 'Users', path: '/users' },
    { key: 'software', label: 'Software', path: '/software' },
    { key: 'licenses', label: 'Licenses', path: '/licenses' },
  ];

  // Handle logout - clears token and redirects to login
  const handleLogout = () => {
    logout();
  };

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
      display: 'flex',
      flexDirection: 'column',
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
      flex: 1,
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
    logoutContainer: {
      padding: '0 20px 20px 20px',
      borderTop: '1px solid #e2e8f0',
      marginTop: 'auto',
    },
    logoutButton: {
      width: '100%',
      padding: '10px 14px',
      fontSize: '13px',
      fontWeight: '500',
      color: '#64748b',
      backgroundColor: 'transparent',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
  };

  return (
    <div style={sidebarStyles.sidebar}>
      {/* Brand/Logo Section */}
      <div style={sidebarStyles.brand}>
        <h2 style={sidebarStyles.brandText}>SeatWatch</h2>
      </div>

      {/* Navigation Items */}
      <nav style={sidebarStyles.navContainer}>
        {navItems.map((item) => (
          <div
            key={item.key}
            // Navigate to the route when user clicks
            onClick={() => navigate(item.path)}
            // Apply active style if this item matches current page
            style={{
              ...sidebarStyles.navItem,
              ...(activePage === item.key ? sidebarStyles.navItemActive : {}),
            }}
          >
            {item.label}
          </div>
        ))}
      </nav>

      {/* Logout Section */}
      <div style={sidebarStyles.logoutContainer}>
        <button
          style={sidebarStyles.logoutButton}
          onClick={handleLogout}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.style.color = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
