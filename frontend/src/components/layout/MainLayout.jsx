/**
 * MAIN LAYOUT COMPONENT
 * Wraps protected pages with sidebar and header
 */

import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import './MainLayout.css';

export function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="main-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-layout__content">
        <Header onMenuClick={toggleSidebar} />
        <main className="main-layout__main">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
