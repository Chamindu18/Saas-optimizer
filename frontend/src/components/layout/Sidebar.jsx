import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Boxes, KeyRound, Shield, UserCog, ScrollText } from 'lucide-react';
import { useRole } from '../../hooks/useRole';

export const navigation = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Employees', path: '/employees', icon: Users },
  { label: 'Software', path: '/software', icon: Boxes },
  { label: 'Licenses', path: '/licenses', icon: KeyRound },
  { label: 'Administration', path: '/admin', icon: Shield, admin: true },
  { label: 'Role management', path: '/role-management', icon: UserCog, admin: true },
  { label: 'Audit log', path: '/audit-log', icon: ScrollText, admin: true },
];

export default function Sidebar({ onNavigate, id }) {
  const { isAdmin } = useRole();
  const items = navigation.filter(item => !item.admin || isAdmin);
  const renderLink = item => <NavLink key={item.path} to={item.path} end onClick={onNavigate} className={({ isActive }) => `sw-nav__link${isActive ? ' sw-nav__link--active' : ''}`}>
    <item.icon size={18} strokeWidth={1.8} aria-hidden="true" />
    <span>{item.label}</span>
  </NavLink>;
  return <nav id={id} className="sw-nav" aria-label="Primary navigation">
    <div className="sw-nav__group"><p className="sw-nav__label">Workspace</p>{items.filter(item => !item.admin).map(renderLink)}</div>
    {isAdmin && <div className="sw-nav__group"><p className="sw-nav__label">Administration</p>{items.filter(item => item.admin).map(renderLink)}</div>}
  </nav>;
}
