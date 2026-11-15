import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { navigation } from './Sidebar';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel } from '../system/DropdownMenu';

export default function Header({ onMenuClick, menuButtonRef }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const title = navigation.find(item => item.path === pathname)?.label || 'Workspace';
  const signOut = () => { logout(); navigate('/login', { replace: true }); };
  const initials = (user?.name || user?.email || 'Account').split(/[\s@]+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return <header className="sw-header">
    <button ref={menuButtonRef} type="button" className="sw-icon-button sw-header__menu" onClick={onMenuClick} aria-label="Open navigation"><Menu size={20} aria-hidden="true" /></button>
    <div className="sw-header__context"><span className="sw-header__eyebrow">Workspace</span><span className="sw-header__title">{title}</span></div>
    <DropdownMenu label="Account controls" trigger={<button type="button" className="sw-header__account" aria-label={`Account menu for ${user?.name || user?.email || 'user'}`}>
      <span className="sw-header__avatar" aria-hidden="true">{initials}</span><span className="sw-header__account-name">{user?.name || user?.email || 'Account'}</span><ChevronDown size={16} aria-hidden="true" />
    </button>}>
      <DropdownMenuLabel className="sw-menu__label">{user?.email || 'Signed in'}</DropdownMenuLabel>
      <DropdownMenuItem className="sw-menu__item" onSelect={signOut}><LogOut size={16} aria-hidden="true" /> Sign out</DropdownMenuItem>
    </DropdownMenu>
  </header>;
}
