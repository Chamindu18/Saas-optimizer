import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Software from './components/Software';
import Licenses from './components/Licenses';

function App() {
  // State to track which page is currently active
  // This allows us to conditionally render different components
  const [activePage, setActivePage] = useState('dashboard');

  // Function to get the page title based on active page
  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      users: 'Users',
      software: 'Software',
      licenses: 'Licenses',
    };
    return titles[activePage] || 'Dashboard';
  };

  // Main app layout: Sidebar on left, main content on right
  // Sidebar is fixed, main content scrolls
  return (
    <div style={appStyles.appContainer}>
      {/* Fixed left sidebar with navigation */}
      {/* Pass activePage and setActivePage to Sidebar */}
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Main content area */}
      <div style={appStyles.mainContent}>
        {/* Top navbar with page title */}
        <Navbar title={getPageTitle()} />

        {/* Conditionally render components based on activePage state */}
        {activePage === 'dashboard' && <Dashboard />}
        {activePage === 'users' && <Users />}
        {activePage === 'software' && <Software />}
        {activePage === 'licenses' && <Licenses />}
      </div>
    </div>
  );
}

// Styles for the main app layout
const appStyles = {
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%)',
  },
  mainContent: {
    marginLeft: '250px', // Account for fixed sidebar width
    flex: 1,
    overflowY: 'auto',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%)',
  },
};

export default App;
