import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import { useToast } from '../components/ui/ToastContainer';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../services/api';
import AuthShell from './AuthShell';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const validateForm = () => {
    const next = {};
    if (!formData.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) next.email = 'Please enter a valid email address';
    if (!formData.password) next.password = 'Password is required';
    else if (formData.password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const handleChange = ({ target: { name, value } }) => {
    setFormData(previous => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: null }));
    setApiError(null);
  };
  const handleLogin = async event => {
    event.preventDefault();
    if (loading) return;
    setApiError(null);
    if (!validateForm()) return;
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      addToast('Welcome back!', { type: 'success', duration: 2000 });
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      const message = apiErrorMessage(error);
      setApiError(message);
      addToast(message, { type: 'error' });
    } finally { setLoading(false); }
  };
  return <AuthShell>
    <p className="sw-auth__eyebrow">SeatWatch workspace</p>
    <h1>Welcome back</h1>
    <p className="sw-auth__intro">Sign in to review your organization's software license records.</p>
    <form className="sw-auth__form" onSubmit={handleLogin} noValidate aria-busy={loading}>
      <Input label="Email" type="email" name="email" autoComplete="username" value={formData.email} onChange={handleChange} error={!!errors.email} errorMessage={errors.email} disabled={loading} required />
      <Input label="Password" type="password" name="password" autoComplete="current-password" value={formData.password} onChange={handleChange} error={!!errors.password} errorMessage={errors.password} disabled={loading} showPasswordToggle required />
      {apiError && <p className="sw-auth__error" role="alert">{apiError}</p>}
      <button className="sw-auth__submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <p className="sw-auth__alternate">Need access? <Link to="/register">Create viewer account</Link></p>
  </AuthShell>;
}
