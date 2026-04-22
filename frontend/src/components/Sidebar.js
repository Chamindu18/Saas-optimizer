import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';
import { useRole } from '../hooks/useRole';

function Sidebar({ activePage = 'dashboard' }) {
  const navigate = useNavigate();
  const { role, isAdmin } = useRole();

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { key: 'users', label: 'Users', path: '/users' },
    { key: 'software', label: 'Software', path: '/software' },
    { key: 'licenses', label: 'Licenses', path: '/licenses' },
    // Role Management - admin only
    ...(isAdmin ? [{ key: 'roles', label: 'Role Management', path: '/role-management' }] : []),
  ];

  const handleLogout = () => {
    logout();
  };

  // Role badge styling
  const getRoleBadgeStyle = () => {
    const baseStyle = {
      display: 'inline-block',
      fontSize: '10px',
      padding: '2px 8px',
      borderRadius: '20px',
      border: '1px solid',
      marginLeft: '8px',
      fontWeight: '600',
    };

    switch (role) {
      case 'admin':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(201, 168, 76, 0.15)',
          color: '#C9A84C',
          borderColor: 'rgba(201, 168, 76, 0.25)',
        };
      case 'manager':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(74, 110, 140, 0.15)',
          color: '#7AAAC4',
          borderColor: 'rgba(74, 110, 140, 0.25)',
        };
      case 'viewer':
      default:
        return {
          ...baseStyle,
          backgroundColor: 'rgba(107, 99, 85, 0.15)',
          color: '#A09880',
          borderColor: 'rgba(107, 99, 85, 0.25)',
        };
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">S</div>
        <h2 className="sidebar-title">SeatWatch</h2>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.key}
            className={`nav-item ${activePage === item.key ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {/* Role badge - displays current user's role */}
        {role && (
          <div style={{ marginBottom: '12px', fontSize: '12px' }}>
            <span style={{ color: '#666' }}>Your role:</span>
            <span style={getRoleBadgeStyle()}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
          </div>
        )}

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
