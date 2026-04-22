import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
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

const IconSettings = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.98 2.98l4.24 4.24M1 12h6m6 0h6m-19.78 7.78l4.24-4.24m2.98-2.98l4.24-4.24"></path>
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
  const [isVisible, setIsVisible] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <IconDashboard />,
      path: '/dashboard',
      roles: ['admin', 'manager', 'viewer'],
    },
    {
      id: 'licenses',
      label: 'Licenses',
      icon: <IconLicense />,
      path: '/licenses',
      roles: ['admin', 'manager'],
    },
    {
      id: 'software',
      label: 'Software',
      icon: <IconSoftware />,
      path: '/software',
      roles: ['admin', 'manager'],
    },
    {
      id: 'users',
      label: 'Users',
      icon: <IconUsers />,
      path: '/users',
      roles: ['admin'],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <IconSettings />,
      path: '/settings',
      roles: ['admin'],
    },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(role));

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
        <div className="nav-section">
          <div className="nav-section-label">Main</div>
          {visibleItems.slice(0, 1).map(item => (
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

        {/* Intelligence Section */}
        {visibleItems.slice(1, 3).length > 0 && (
          <div className="nav-section">
            <div className="nav-section-label">Intelligence</div>
            {visibleItems.slice(1, 3).map(item => (
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
        {visibleItems.slice(3).length > 0 && (
          <div className="nav-section">
            <div className="nav-section-label">Admin</div>
            {visibleItems.slice(3).map(item => (
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
      </nav>

      {/* User Section */}
      <div className="sidebar-user">
        <div className="user-avatar">
          {user.fullName
            ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
            : 'U'}
        </div>
        <div className="user-info">
          <div className="user-name">{user.fullName || 'User'}</div>
          <div className="user-role">{role}</div>
        </div>
        <button className="user-logout" onClick={handleLogout} title="Logout">
          <IconLogout />
        </button>
      </div>
    </div>
  );
}
