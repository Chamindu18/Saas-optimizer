import React, { useState } from 'react';
import './App.css';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Software from './components/Software';
import Licenses from './components/Licenses';

function App() {
  // State to track which page/view is currently displayed
  // Possible values: 'home', 'login', 'register', 'dashboard'
  const [currentPage, setCurrentPage] = useState('home');

  // State to track which dashboard page is active
  // This allows us to conditionally render different dashboard sections
  const [activeDashboardPage, setActiveDashboardPage] = useState('dashboard');

  // Function to get the page title based on active dashboard page
  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      users: 'Users',
      software: 'Software',
      licenses: 'Licenses',
    };
    return titles[activeDashboardPage] || 'Dashboard';
  };

  // Show home page
  if (currentPage === 'home') {
    return <Home onGoToLogin={() => setCurrentPage('login')} />;
  }

  // Show login page
  if (currentPage === 'login') {
    return (
      <Login 
        onLogin={() => setCurrentPage('dashboard')}
        onBackToHome={() => setCurrentPage('home')}
        onGoToRegister={() => setCurrentPage('register')}
      />
    );
  }

  // Show register page
  if (currentPage === 'register') {
    return (
      <Register 
        onRegister={() => setCurrentPage('login')}
        onBackToLogin={() => setCurrentPage('login')}
      />
    );
  }

  // Main app layout: Sidebar on left, main content on right
  // Sidebar is fixed, main content scrolls
  return (
    <div style={appStyles.appContainer}>
      {/* Fixed left sidebar with navigation */}
      {/* Pass activeDashboardPage and setActiveDashboardPage to Sidebar */}
      <Sidebar activePage={activeDashboardPage} setActivePage={setActiveDashboardPage} />

      {/* Main content area */}
      <div style={appStyles.mainContent}>
        {/* Top navbar with page title */}
        <Navbar title={getPageTitle()} />

        {/* Conditionally render components based on activeDashboardPage state */}
        {activeDashboardPage === 'dashboard' && <Dashboard />}
        {activeDashboardPage === 'users' && <Users />}
        {activeDashboardPage === 'software' && <Software />}
        {activeDashboardPage === 'licenses' && <Licenses />}
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
