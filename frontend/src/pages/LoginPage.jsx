import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import { useToast } from '../components/ui/ToastContainer';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../services/api';
import '../pages/styles/LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password);

      addToast('Welcome back!', {
        type: 'success',
        duration: 2000,
      });

      // Redirect to dashboard or original page
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      const message = apiErrorMessage(err);
      setApiError(message);
      addToast(message, {
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">📊</div>
            <div className="logo-text">
              <h1 className="logo-title">SaaS Optimizer</h1>
              <p className="logo-subtitle">Enterprise License Management</p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="login-form-section">
          <div className="login-form-header">
            <h2>Sign In</h2>
            <p>Enter your credentials to access your workspace</p>
          </div>

          {apiError && (
            <Alert
              type="danger"
              message={apiError}
              onClose={() => setApiError(null)}
            />
          )}

          <form onSubmit={handleLogin} className="login-form">
            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              errorMessage={errors.email}
              disabled={loading}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              errorMessage={errors.password}
              disabled={loading}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              loading={loading}
              className="login-submit-btn"
            >
              Sign In
            </Button>
          </form>

        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>Need help? Contact your administrator</p>
        </div>
      </div>

      {/* Right Side - Info Panel */}
      <div className="login-info-panel">
        <div className="login-info-content">
          <h2>Manage Your SaaS Portfolio</h2>
          <ul className="login-info-list">
            <li>
              <span className="info-icon">✓</span>
              <span>Track all licenses in one place</span>
            </li>
            <li>
              <span className="info-icon">✓</span>
              <span>Detect idle licenses automatically</span>
            </li>
            <li>
              <span className="info-icon">✓</span>
              <span>Calculate potential savings</span>
            </li>
            <li>
              <span className="info-icon">✓</span>
              <span>Prune unused subscriptions</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
