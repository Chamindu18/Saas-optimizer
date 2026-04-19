import React from 'react';

// Home/Landing page component
function Home({ onGoToLogin }) {
  return (
    <div style={homeStyles.container}>
      {/* Hero Section */}
      <div style={homeStyles.heroSection}>
        <h1 style={homeStyles.heroTitle}>
          Optimize Your SaaS Spending
        </h1>
        <p style={homeStyles.heroSubtitle}>
          Track licenses, identify unused software, and reduce costs with intelligent analytics
        </p>
        <button 
          style={homeStyles.primaryButton}
          onClick={onGoToLogin}
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
          Sign In
        </button>
      </div>

      {/* Features Section */}
      <div style={homeStyles.featuresSection}>
        <h2 style={homeStyles.featuresTitle}>Key Features</h2>
        
        <div style={homeStyles.featuresGrid}>
          {/* Cost Tracking Feature */}
          <div style={homeStyles.featureCard}>
            <div style={homeStyles.featureIcon}>
              <span style={homeStyles.iconText}>💰</span>
            </div>
            <h3 style={homeStyles.featureTitle}>Cost Tracking</h3>
            <p style={homeStyles.featureDescription}>
              Monitor total spending across all your SaaS applications in real-time
            </p>
          </div>

          {/* Idle Detection Feature */}
          <div style={homeStyles.featureCard}>
            <div style={homeStyles.featureIcon}>
              <span style={homeStyles.iconText}>🔍</span>
            </div>
            <h3 style={homeStyles.featureTitle}>Idle Detection</h3>
            <p style={homeStyles.featureDescription}>
              Automatically identify and eliminate unused licenses to save money
            </p>
          </div>

          {/* Analytics Feature */}
          <div style={homeStyles.featureCard}>
            <div style={homeStyles.featureIcon}>
              <span style={homeStyles.iconText}>📊</span>
            </div>
            <h3 style={homeStyles.featureTitle}>Analytics</h3>
            <p style={homeStyles.featureDescription}>
              Get actionable insights with comprehensive dashboards and reports
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Styles object for Home component
const homeStyles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%)',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    textAlign: 'center',
    maxWidth: '700px',
    marginBottom: '80px',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 16px 0',
    letterSpacing: '-1px',
    lineHeight: '1.2',
  },
  heroSubtitle: {
    fontSize: '18px',
    color: '#64748b',
    margin: '0 0 32px 0',
    lineHeight: '1.6',
    fontWeight: '400',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    padding: '14px 40px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
    transition: 'all 0.3s ease',
  },
  featuresSection: {
    width: '100%',
    maxWidth: '1000px',
  },
  featuresTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    margin: '0 0 48px 0',
    letterSpacing: '-0.5px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '28px',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '32px 24px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    ':hover': {
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(-2px)',
    },
  },
  featureIcon: {
    fontSize: '40px',
    marginBottom: '16px',
  },
  iconText: {
    fontSize: '48px',
    display: 'block',
  },
  featureTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 12px 0',
    letterSpacing: '-0.3px',
  },
  featureDescription: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.6',
    margin: 0,
    fontWeight: '400',
  },
};

export default Home;
