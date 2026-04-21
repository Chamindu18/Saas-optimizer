import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">Optimize Your SaaS Spending</h1>
        <p className="home-subtitle">
          Track licenses, identify unused software, and reduce costs with intelligent analytics
        </p>

        <div className="home-features">
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3 className="feature-title">Cost Tracking</h3>
            <p className="feature-desc">
              Monitor total spending across all your SaaS applications in real-time
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3 className="feature-title">Idle Detection</h3>
            <p className="feature-desc">
              Automatically identify and eliminate unused licenses to save money
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Analytics</h3>
            <p className="feature-desc">
              Get actionable insights with comprehensive dashboards and reports
            </p>
          </div>
        </div>

        <div className="home-buttons">
          <button className="btn-primary" onClick={() => navigate('/login')}>
            Sign In
          </button>
          <button className="btn-secondary" onClick={() => navigate('/register')}>
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;

