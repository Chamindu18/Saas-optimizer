import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/ToastContainer';
import '../pages/styles/AuthPages.css';

const IconGoogle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      addToast('Welcome back!', {
        type: 'success',
        title: 'Login successful',
        duration: 2000,
      });

      navigate('/dashboard');
    } catch (err) {
      addToast(err.message || 'Login failed', {
        type: 'error',
        title: 'Error',
      });
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Panel */}
      <div className="auth-panel auth-panel-left">
        <div className="panel-content">
          <div className="panel-logo">
            <span className="logo-seat">Seat</span>
            <span className="logo-watch">Watch</span>
          </div>
          
          <div className="panel-message">
            <p className="panel-quote">
              "We saved $47K/month in wasted SaaS licenses. SeatWatch found them in 3 hours."
            </p>
            <div className="panel-author">
              <div className="author-avatar">SK</div>
              <div className="author-info">
                <div className="author-name">Sarah Kim</div>
                <div className="author-title">COO, TechCorp</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="auth-panel auth-panel-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Welcome back</h1>
            <p className="auth-form-subtitle">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              errorMessage={errors.email}
              disabled={loading}
            />

            <div style={{ position: 'relative' }}>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
                errorMessage={errors.password}
                disabled={loading}
                showPasswordToggle
              />
              <a href="#forgot" className="forgot-password">
                Forgot password?
              </a>
            </div>

            {errors.form && (
              <div className="form-error" style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-text)',
                color: 'var(--danger-text)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
              }}>
                {errors.form}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              block
              size="lg"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="form-divider">or continue with</div>

          <button className="btn btn-secondary btn-block" disabled={loading}>
            <IconGoogle />
            Continue with Google
          </button>

          <p className="auth-form-footer">
            Don't have an account?{' '}
            <a href="/register" className="auth-link">
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
