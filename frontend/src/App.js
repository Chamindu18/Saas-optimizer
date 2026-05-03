import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastContainer';

// Import design system (new)
import './styles/design-system.css';
import './App.css';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import RoleManagementPage from './pages/RoleManagementPage';
import AuditLogPage from './pages/AuditLogPage';

// Layout
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

// Protected Layout Wrapper
function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <Header />
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* ====== PUBLIC ROUTES ====== */}
          <Route path="/login" element={<LoginPage />} />

          {/* ====== PROTECTED ROUTES ====== */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          {/* ====== ADMIN ROUTES ====== */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <DashboardLayout>
                    <AdminDashboardPage />
                  </DashboardLayout>
                </AdminRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/role-management"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <DashboardLayout>
                    <RoleManagementPage />
                  </DashboardLayout>
                </AdminRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/audit-log"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <DashboardLayout>
                    <AuditLogPage />
                  </DashboardLayout>
                </AdminRoute>
              </PrivateRoute>
            }
          />

          {/* Catch-all redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
