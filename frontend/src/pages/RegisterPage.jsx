import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/ToastContainer';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../services/api';
import '../pages/styles/AuthPages.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { register } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[!@#$%^&*]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(form.password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Good', 'Strong'];

  const validateForm = () => {
    const newErrors = {};
    if (!form.fullName) newErrors.fullName = 'Name is required';
    if (!form.email) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Email is invalid';
    if (!form.password) newErrors.password = 'Password is required';
    if (form.password.length < 8) newErrors.password = 'Password must be 8+ characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(form.fullName, form.email, form.password);

      addToast('Account created successfully!', {
        type: 'success',
        title: 'Welcome',
        duration: 2000,
      });

      navigate('/dashboard', { replace: true });
    } catch (err) {
      addToast(apiErrorMessage(err), {
        type: 'error',
        title: 'Error',
      });
      setErrors({ form: apiErrorMessage(err) });
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
              Track software licenses and identify potential monthly savings.
            </p>
            <div className="panel-author">
              <div className="author-avatar">JM</div>
              <div className="author-info">
                <div className="author-name">SeatWatch</div>
                <div className="author-title">License management</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="auth-panel auth-panel-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Create account</h1>
            <p className="auth-form-subtitle">Join your team and start optimizing</p>
          </div>

          <form onSubmit={handleRegister} className="auth-form">
            <Input
              label="Full Name"
              type="text"
              placeholder="Jane Doe"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              error={!!errors.fullName}
              errorMessage={errors.fullName}
              disabled={loading}
            />

            <Input
              label="Work Email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={!!errors.email}
              errorMessage={errors.email}
              disabled={loading}
            />

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={!!errors.password}
                errorMessage={errors.password}
                disabled={loading}
                showPasswordToggle
              />
              {form.password && (
                <div className="password-strength-container">
                  <div className="password-strength-bar">
                    <div 
                      className={`password-strength-fill strength-${passwordStrength}`}
                      style={{ width: `${(passwordStrength + 1) * 20}%` }}
                    ></div>
                  </div>
                  <div className={`password-strength-label strength-${passwordStrength}`}>
                    Strength: {strengthLabels[passwordStrength]}
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              error={!!errors.confirmPassword}
              errorMessage={errors.confirmPassword}
              disabled={loading}
              showPasswordToggle
            />


            {errors.form && (
              <div style={{
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
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>


          <p className="auth-form-footer">
            Already have an account?{' '}
            <a href="/login" className="auth-link">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
