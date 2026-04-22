import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Software from './components/Software';
import Licenses from './components/Licenses';
import RoleManagement from './components/RoleManagement';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

/**
 * Main App Component
 * 
 * Sets up React Router with all routes:
 * - Public routes: /, /login, /register
 * - Protected routes: /dashboard, /users, /software, /licenses
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes - No authentication required */}

        {/* Home page route */}
        <Route path="/" element={<Home />} />

        {/* Login page route */}
        <Route path="/login" element={<Login />} />

        {/* Register page route */}
        <Route path="/register" element={<Register />} />

        {/* Protected Routes - Authentication required */}
        {/* Dashboard layout with sidebar and main content */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardLayout page="dashboard" />
            </PrivateRoute>
          }
        />

        {/* Users page with dashboard layout */}
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <DashboardLayout page="users" />
            </PrivateRoute>
          }
        />

        {/* Software page with dashboard layout */}
        <Route
          path="/software"
          element={
            <PrivateRoute>
              <DashboardLayout page="software" />
            </PrivateRoute>
          }
        />

        {/* Licenses page with dashboard layout */}
        <Route
          path="/licenses"
          element={
            <PrivateRoute>
              <DashboardLayout page="licenses" />
            </PrivateRoute>
          }
        />

        {/* Role Management page - admin only */}
        <Route
          path="/role-management"
          element={
            <PrivateRoute>
              <DashboardLayout page="roles" />
            </PrivateRoute>
          }
        />

        {/* Catch-all: redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

/**
 * DashboardLayout Component
 * 
 * Renders the sidebar + navbar + content area for authenticated pages
 * Shows different content based on the 'page' prop
 */
function DashboardLayout({ page }) {
  // Function to get the page title based on current page
  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      users: 'Users',
      software: 'Software',
      licenses: 'Licenses',
      roles: 'Role Management',
    };
    return titles[page] || 'Dashboard';
  };

  return (
    <div style={appStyles.appContainer}>
      {/* Fixed left sidebar with navigation */}
      <Sidebar activePage={page} />

      {/* Main content area */}
      <div style={appStyles.mainContent}>
        {/* Top navbar with page title - not shown for full-page components like RoleManagement */}
        {page !== 'roles' && <Navbar title={getPageTitle()} />}

        {/* Conditionally render components based on page state */}
        {page === 'dashboard' && <Dashboard />}
        {page === 'users' && <Users />}
        {page === 'software' && <Software />}
        {page === 'licenses' && <Licenses />}
        {page === 'roles' && <RoleManagement />}
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
