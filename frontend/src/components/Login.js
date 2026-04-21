import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { setToken } from '../utils/auth';

// Login page component
function Login() {
  const navigate = useNavigate();
  
  // State for form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // State for validation errors and API errors
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login form submission - calls backend API
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      // Call POST /api/auth/login endpoint
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        // Store token in localStorage
        setToken(response.data.token);
        
        // Redirect to dashboard on success
        navigate('/dashboard');
      }
    } catch (error) {
      // Show error message to user
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={loginStyles.container}>
      {/* Login Card */}
      <div style={loginStyles.card}>
        <h1 style={loginStyles.title}>Sign In</h1>
        <p style={loginStyles.subtitle}>
          Enter your credentials to access the dashboard
        </p>

        {/* API Error Message */}
        {apiError && (
          <div style={loginStyles.errorBanner}>
            {apiError}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={loginStyles.form}>
          {/* Email Field */}
          <div style={loginStyles.formGroup}>
            <label style={loginStyles.label} htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              style={{
                ...loginStyles.input,
                ...(errors.email && loginStyles.inputError),
              }}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.email ? '#dc2626' : '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
              disabled={isLoading}
            />
            {errors.email && (
              <p style={loginStyles.errorText}>{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div style={loginStyles.formGroup}>
            <label style={loginStyles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              style={{
                ...loginStyles.input,
                ...(errors.password && loginStyles.inputError),
              }}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.password ? '#dc2626' : '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
              disabled={isLoading}
            />
            {errors.password && (
              <p style={loginStyles.errorText}>{errors.password}</p>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...loginStyles.loginButton,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Register Link */}
        <div style={loginStyles.linkContainer}>
          <span style={loginStyles.linkText}>Don't have an account? </span>
          <button
            type="button"
            style={loginStyles.linkButton}
            onClick={() => navigate('/register')}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#3b82f6';
            }}
            disabled={isLoading}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}

// Styles object for Login component
const loginStyles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '420px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 32px 0',
    lineHeight: '1.6',
    fontWeight: '400',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '20px',
    border: '1px solid #fecaca',
  },
  form: {
    marginBottom: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px',
    letterSpacing: '-0.2px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '14px',
    fontWeight: '400',
    color: '#1e293b',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    backgroundColor: '#ffffff',
    fontFamily: 'inherit',
  },
  inputError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    fontSize: '13px',
    color: '#dc2626',
    marginTop: '6px',
    margin: '6px 0 0 0',
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
    transition: 'all 0.3s ease',
    marginBottom: '12px',
  },
  secondaryButton: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '12px',
  },
  linkContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
  },
  linkText: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  linkButton: {
    fontSize: '14px',
    color: '#3b82f6',
    fontWeight: '600',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 0.2s ease',
  },
};

export default Login;
