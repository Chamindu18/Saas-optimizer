/**
 * MAIN APP COMPONENT
 * Router setup and authentication provider
 */

import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import { AdminRoute } from './components/AdminRoute';
import { ToastProvider } from './components/ui/ToastContainer';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import SoftwarePage from './pages/SoftwarePage';
import LicensesPage from './pages/LicensesPage';
import AdminPage from './pages/AdminPage';

// Layout
import MainLayout from './components/layout/MainLayout';

// Styles
import './styles/design-system.css';
import './App.css';

/**
 * Layout Wrapper for Protected Routes
 * Includes sidebar, header, and main content area
 */
function ProtectedLayout({ children }) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}

/**
 * Main App Component
 */
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
          {/* ============================================
              PUBLIC ROUTES (Authentication & Home)
              ============================================ */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ============================================
              PROTECTED ROUTES (Authenticated Users)
              ============================================ */}

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <DashboardPage />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* Employee Management */}
          <Route
            path="/employees"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <UsersPage />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* Software Management */}
          <Route path="/users" element={<Navigate to="/employees" replace />} />
          <Route
            path="/software"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <SoftwarePage />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* Licenses Management */}
          <Route
            path="/licenses"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <LicensesPage />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />

          {/* ============================================
              ADMIN ROUTES (Admin Only)
              ============================================ */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <ProtectedLayout>
                    <AdminPage />
                  </ProtectedLayout>
                </AdminRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/role-management"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <ProtectedLayout>
                    <AdminPage />
                  </ProtectedLayout>
                </AdminRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/audit-log"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <ProtectedLayout>
                    <AdminPage />
                  </ProtectedLayout>
                </AdminRoute>
              </PrivateRoute>
            }
          />

          {/* ============================================
              CATCH-ALL / DEFAULT ROUTES
              ============================================ */}
          {/* Redirect to home page */}
          <Route
            path="/"
            element={<Navigate to="/home" replace />}
          />

          {/* 404 Not Found */}
          <Route
            path="*"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h1>Page Not Found</h1>
                    <p>The page you're looking for doesn't exist.</p>
                    <a href="/dashboard" style={{ color: 'var(--color-primary-600)' }}>
                      Back to Dashboard
                    </a>
                  </div>
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
    </ToastProvider>
  );
}

export default App;
