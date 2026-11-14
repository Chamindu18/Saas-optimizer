import React from 'react';
import { useAuth } from '../../context/AuthContext';
import '../styles/Header.css';

export default function Header({ title = 'Dashboard' }) {
  const { user } = useAuth();
  return <header className="header">
    <div className="header-breadcrumb">
      <span className="breadcrumb-item">SeatWatch</span>
      {title && <><span className="breadcrumb-separator">/</span><span className="breadcrumb-item active">{title}</span></>}
    </div>
    <div className="header-right"><div className="header-avatar" aria-label={user?.name || 'Account'}>
      {user?.name ? user.name.split(' ').map(part => part[0]).join('').toUpperCase() : 'U'}
    </div></div>
  </header>;
}
