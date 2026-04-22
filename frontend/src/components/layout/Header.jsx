import React, { useState } from 'react';
import '../styles/Header.css';

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

export default function Header({ title = 'Dashboard', subtitle = '' }) {
  const [searchFocus, setSearchFocus] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <header className="header">
      {/* Left: Breadcrumb */}
      <div className="header-breadcrumb">
        <span className="breadcrumb-item">Dashboard</span>
        {title && title !== 'Dashboard' && (
          <>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item active">{title}</span>
          </>
        )}
      </div>

      {/* Center: Search */}
      <div className={`header-search ${searchFocus ? 'focused' : ''}`}>
        <IconSearch />
        <input
          type="text"
          placeholder="Search licenses, users, software..."
          className="search-input"
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
        />
        <span className="search-shortcut">⌘K</span>
      </div>

      {/* Right: Notifications + Avatar */}
      <div className="header-right">
        <button className="header-button notification-button">
          <IconBell />
          <span className="notification-dot"></span>
        </button>

        <div className="header-avatar">
          {user.fullName
            ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
            : 'U'}
        </div>
      </div>
    </header>
  );
}
