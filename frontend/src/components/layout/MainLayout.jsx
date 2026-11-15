import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { Sheet } from '../system/Sheet';
import '../../styles/seatwatch-system.css';
import './MainLayout.css';

export function MainLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  return <div className="sw-app sw-layout">
    <a className="sw-skip" href="#main-content">Skip to content</a>
    <aside className="sw-layout__sidebar" aria-label="SeatWatch sidebar">
      <div className="sw-brand"><span className="sw-brand__mark" aria-hidden="true">S</span><span>SeatWatch</span></div>
      <Sidebar />
      <div className="sw-layout__sidebar-footer">Software seat management</div>
    </aside>
    <div className="sw-layout__content">
      <Header menuButtonRef={menuButtonRef} onMenuClick={() => setMobileOpen(true)} />
      <main id="main-content" className="sw-layout__main" tabIndex={-1}><div className="sw-layout__container">{children}</div></main>
    </div>
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen} returnFocusRef={menuButtonRef} title="SeatWatch navigation"><Sidebar onNavigate={() => setMobileOpen(false)} id="mobile-navigation" /></Sheet>
  </div>;
}

export default MainLayout;
