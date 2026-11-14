import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { useAuth } from '../../context/AuthContext';
import '../styles/Sidebar.css';

// SVG Icons (inline for simplicity)
const IconDashboard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const IconLicense = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);

const IconSoftware = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5 12 3"></polyline>
    <polyline points="12 12 20 7.5"></polyline>
    <polyline points="12 12 12 21"></polyline>
    <polyline points="12 12 4 7.5"></polyline>
  </svg>
);

const IconUsers = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const IconShield = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const IconClock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

export default function Sidebar() {
  const navigate = useNavigate();
  const { role } = useRole();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <IconDashboard />,
      path: '/dashboard',
      roles: ['admin', 'manager', 'viewer'],
      section: 'MAIN'
    },
    {
      id: 'licenses',
      label: 'Licenses',
      icon: <IconLicense />,
      path: '/licenses',
      roles: ['admin', 'manager', 'viewer'],
      section: 'MAIN'
    },
    {
      id: 'software',
      label: 'Software',
      icon: <IconSoftware />,
      path: '/software',
      roles: ['admin', 'manager', 'viewer'],
      section: 'MAIN'
    },
    {
      id: 'users',
      label: 'Employees',
      icon: <IconUsers />,
      path: '/employees',
      roles: ['admin', 'manager', 'viewer'],
      section: 'MAIN'
    },
    // ADMIN section
    {
      id: 'admin-panel',
      label: 'Admin Panel',
      icon: <IconShield />,
      path: '/admin',
      roles: ['admin'],
      section: 'ADMIN'
    },
    {
      id: 'role-management',
      label: 'Role Management',
      icon: <IconLock />,
      path: '/role-management',
      roles: ['admin'],
      section: 'ADMIN'
    },
    {
      id: 'audit-log',
      label: 'Audit Log',
      icon: <IconClock />,
      path: '/audit-log',
      roles: ['admin'],
      section: 'ADMIN'
    },
  ];

  // Filter by role
  const visibleItems = navItems.filter(item => item.roles.includes(role));

  // Group by section
  const mainItems = visibleItems.filter(item => item.section === 'MAIN');
  const adminItems = visibleItems.filter(item => item.section === 'ADMIN');

  return (
    <div className="sidebar">
      {/* Logo Area */}
      <div className="sidebar-logo">
        <div className="logo-text">
          <span className="logo-seat">Seat</span>
          <span className="logo-watch">Watch</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Main Section */}
        {mainItems.length > 0 && (
          <div className="nav-section">
            <div className="nav-section-label">Main</div>
            {mainItems.map(item => (
              <button
                key={item.id}
                className="nav-item"
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Admin Section */}
        {adminItems.length > 0 && (
          <div className="nav-section">
            <div className="nav-section-label admin-label">
              <span>Admin</span>
              <span className="admin-badge">★</span>
            </div>
            {adminItems.map(item => (
              <button
                key={item.id}
                className="nav-item admin-item"
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="sidebar-user-card">
        <div className="user-avatar">
          {user?.email
            ? user.email.split('@')[0].substring(0, 2).toUpperCase()
            : 'U'}
        </div>
        <div className="user-info">
          <div className="user-name">{user?.email || 'User'}</div>
          <span className={`role-badge role-badge--${role}`}>{role}</span>
        </div>
        <button className="user-logout" onClick={handleLogout} title="Sign out">
          <IconLogout />
        </button>
      </div>
    </div>
  );
}
