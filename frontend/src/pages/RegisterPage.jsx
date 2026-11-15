import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input.jsx';
import { useToast } from '../components/ui/ToastContainer';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../services/api';
import AuthShell from './AuthShell';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const validateForm = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = 'Email is invalid';
    if (!form.password) next.password = 'Password is required';
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters';
    if (!form.confirmPassword) next.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const update = (name, value) => {
    setForm(previous => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: null, form: null }));
  };
  const handleRegister = async event => {
    event.preventDefault();
    if (loading || !validateForm()) return;
    setLoading(true);
    try {
      await register(form.fullName, form.email, form.password);
      addToast('Account created successfully!', { type: 'success', title: 'Welcome', duration: 2000 });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message = apiErrorMessage(error);
      addToast(message, { type: 'error', title: 'Error' });
      setErrors(previous => ({ ...previous, form: message }));
    } finally { setLoading(false); }
  };
  return <AuthShell>
    <p className="sw-auth__eyebrow">Get started</p>
    <h1>Create a viewer account</h1>
    <p className="sw-auth__intro">View software licenses and estimated costs in the current shared organizational workspace. An admin manages permissions for changes.</p>
    <form className="sw-auth__form" onSubmit={handleRegister} noValidate aria-busy={loading}>
      <Input label="Full name" type="text" name="fullName" autoComplete="name" value={form.fullName} onChange={event => update('fullName', event.target.value)} error={!!errors.fullName} errorMessage={errors.fullName} disabled={loading} required />
      <Input label="Email" type="email" name="email" autoComplete="email" value={form.email} onChange={event => update('email', event.target.value)} error={!!errors.email} errorMessage={errors.email} disabled={loading} required />
      <Input id="register-password" label="Password" type="password" name="password" autoComplete="new-password" value={form.password} onChange={event => update('password', event.target.value)} error={!!errors.password} errorMessage={errors.password} aria-describedby={errors.password ? 'register-password-description register-password-hint' : 'register-password-hint'} disabled={loading} showPasswordToggle required />
      <p id="register-password-hint" className="sw-auth__hint">Use at least 8 characters.</p>
      <Input label="Confirm password" type="password" name="confirmPassword" autoComplete="new-password" value={form.confirmPassword} onChange={event => update('confirmPassword', event.target.value)} error={!!errors.confirmPassword} errorMessage={errors.confirmPassword} disabled={loading} showPasswordToggle required />
      {errors.form && <p className="sw-auth__error" role="alert">{errors.form}</p>}
      <button className="sw-auth__submit" type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Create viewer account'}</button>
    </form>
    <p className="sw-auth__alternate">Already have an account? <Link to="/login">Sign in</Link></p>
  </AuthShell>;
}
