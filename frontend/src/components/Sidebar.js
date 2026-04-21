import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';

function Sidebar({ activePage = 'dashboard' }) {
  const navigate = useNavigate();

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { key: 'users', label: 'Users', path: '/users' },
    { key: 'software', label: 'Software', path: '/software' },
    { key: 'licenses', label: 'Licenses', path: '/licenses' },
  ];

  const handleLogout = () => {
    logout();
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
