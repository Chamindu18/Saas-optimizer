import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastContainer';
import { initScrollReveal } from './utils/scrollReveal';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

// Layout
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PrivateRoute from './components/PrivateRoute';

// Protected Layout Wrapper
function DashboardLayout({ children, title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '220px' }}>
        <Header title={title} subtitle={subtitle} />
        <main style={{ padding: '24px', paddingTop: '80px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    // Initialize scroll reveal animations
    initScrollReveal();
  }, []);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* ====== PUBLIC ROUTES ====== */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ====== PROTECTED ROUTES ====== */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout title="Dashboard" subtitle="Overview of your SaaS spend and licenses">
                  <DashboardPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
