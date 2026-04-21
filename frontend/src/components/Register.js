import React, { useState } from 'react';

// Register page component
function Register({ onRegister, onBackToLogin }) {
  // State for form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // State for validation errors
  const [errors, setErrors] = useState({});

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
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

  // Handle register form submission
  const handleRegister = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Simulate register (no backend call yet)
      console.log('Register attempt:', { name, email, password });
      onRegister();
    }
  };

  return (
    <div style={registerStyles.container}>
      {/* Register Card */}
      <div style={registerStyles.card}>
        <h1 style={registerStyles.title}>Create Account</h1>
        <p style={registerStyles.subtitle}>
          Sign up to get started with our platform
        </p>

        {/* Register Form */}
        <form onSubmit={handleRegister} style={registerStyles.form}>
          {/* Name Field */}
          <div style={registerStyles.formGroup}>
            <label style={registerStyles.label} htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              style={{
                ...registerStyles.input,
                ...(errors.name && registerStyles.inputError),
              }}
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.name ? '#dc2626' : '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {errors.name && (
              <p style={registerStyles.errorText}>{errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div style={registerStyles.formGroup}>
            <label style={registerStyles.label} htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              style={{
                ...registerStyles.input,
                ...(errors.email && registerStyles.inputError),
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
            />
            {errors.email && (
              <p style={registerStyles.errorText}>{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div style={registerStyles.formGroup}>
            <label style={registerStyles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              style={{
                ...registerStyles.input,
                ...(errors.password && registerStyles.inputError),
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
            />
            {errors.password && (
              <p style={registerStyles.errorText}>{errors.password}</p>
            )}
          </div>

          {/* Register Button */}
          <button
            type="submit"
            style={registerStyles.registerButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Register
          </button>
        </form>

        {/* Already have account link */}
        <div style={registerStyles.linkContainer}>
          <span style={registerStyles.linkText}>Already have an account? </span>
          <button
            style={registerStyles.linkButton}
            onClick={onBackToLogin}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#3b82f6';
            }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

// Styles object for Register component
const registerStyles = {
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
  registerButton: {
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

export default Register;
