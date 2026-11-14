import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { statsAPI } from '../services/api';
import '../pages/styles/HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSoftware: 0,
    totalLicenses: 0,
  });
  const [statsError, setStatsError] = useState(null);



  useEffect(() => {
    const fetchHomeStats = async () => {
      try {
        const payload = await statsAPI.getHomeStats();
        setStats({
          totalUsers: payload.totalUsers || 0,
          totalSoftware: payload.totalSoftware || 0,
          totalLicenses: payload.totalLicenses || 0,
        });
        setStatsError(null);
      } catch (error) {
        setStatsError(error.message);
      }
    };

    fetchHomeStats();
  }, []);

  return (
    <>
      {/* Background Orbs */}
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>
      <div className="bg-orb bg-orb-3"></div>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <span className="logo-seat">Seat</span>
          <span className="logo-watch">Watch</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
        </div>
        <div className="nav-actions">
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Sign in
          </Button>
          <Button variant="primary" onClick={() => navigate('/register')}>
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="hero-badge" data-reveal="">
              Built for operations teams
            </div>

            <h1 className="hero-title reveal">
              <span className="hero-line-1">Stop paying for</span>
              <span className="hero-line-2">software nobody uses</span>
            </h1>

            <p className="hero-subtitle reveal reveal-delay-1">
              SeatWatch detects idle licenses, tracks spend, and tells you exactly where your budget is
              being wasted.
            </p>

            <div className="hero-cta reveal reveal-delay-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/register')}
              >
                Start for free
              </Button>
              <button className="cta-link" onClick={() => navigate('/dashboard')}>
                See the dashboard →
              </button>
            </div>

            <div className="hero-social reveal reveal-delay-3">
              <p>Live platform stats</p>
              <div className="social-avatars">
                <div className="avatar">U</div>
                <div className="avatar">S</div>
                <div className="avatar">L</div>
              </div>
            </div>
          </div>

          <div className="hero-visual reveal reveal-delay-4">
            <div className="preview-card">
              <div className="preview-header">
                <div className="preview-dot"></div>
                <div className="preview-dot"></div>
                <div className="preview-dot"></div>
              </div>
              <div className="preview-content">
                <div className="preview-metric">
                  <div className="preview-label">Total Users</div>
                  <div className="preview-value">{stats.totalUsers.toLocaleString()}</div>
                </div>
                <div className="preview-metric">
                  <div className="preview-label">Total Licenses</div>
                  <div className="preview-value" style={{ color: 'var(--danger-text)' }}>
                    {stats.totalLicenses.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="preview-glow"></div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <div className="chevron"></div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        <div className="stat">
          <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
          <div className="stat-label">Total users</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat">
          <div className="stat-value">{stats.totalSoftware.toLocaleString()}</div>
          <div className="stat-label">Software tools tracked</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat">
          <div className="stat-value">{stats.totalLicenses.toLocaleString()}</div>
          <div className="stat-label">Active licenses recorded</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat">
          <div className="stat-value">Live</div>
          <div className="stat-label">Stats from your database</div>
        </div>
      </section>

      {statsError && (
        <div className="stats-error" style={{ textAlign: 'center', color: 'var(--danger-text)', marginTop: '12px' }}>
          {statsError}
        </div>
      )}

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-label">WHAT IT DOES</div>
        <h2 className="section-title">Everything you need to cut SaaS waste</h2>

        <div className="features-grid">
          {/* Feature 1 */}
          <div className="feature-card reveal">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
                <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round"></line>
              </svg>
            </div>
            <h3 className="feature-title">Ghost Account Detection</h3>
            <p className="feature-desc">Automatically flags licenses unused for 30+ days. No manual auditing.</p>
            <a href="/register" className="feature-link">Learn more →</a>
          </div>

          {/* Feature 2 */}
          <div className="feature-card reveal reveal-delay-1">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
            </div>
            <h3 className="feature-title">Real-time Spend Tracking</h3>
            <p className="feature-desc">See exactly what each department costs. Broken down by tool and team.</p>
            <a href="/register" className="feature-link">Learn more →</a>
          </div>

          {/* Feature 3 */}
          <div className="feature-card reveal reveal-delay-2">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="6" cy="6" r="3"></circle>
                <circle cx="18" cy="6" r="3"></circle>
                <path d="M9 6h6M6 9v6M18 9v6M7.5 17h9"></path>
              </svg>
            </div>
            <h3 className="feature-title">One-click License Pruning</h3>
            <p className="feature-desc">Release idle seats instantly. Savings counter updates in real time.</p>
            <a href="/register" className="feature-link">Learn more →</a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="about">
        <div className="section-label">PROCESS</div>
        <h2 className="section-title">How it works</h2>

        <div className="steps-container">
          {/* Step 1 */}
          <div className="step reveal">
            <div className="step-number">01</div>
            <div className="step-badge">Step 1</div>
            <h3 className="step-title">Connect Your Tools</h3>
            <p className="step-desc">Link your SaaS apps in minutes. We support 500+ integrations.</p>
            <ul className="step-list">
              <li>✓ OAuth secure</li>
              <li>✓ Real-time sync</li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="step reveal reveal-delay-1">
            <div className="step-number">02</div>
            <div className="step-badge">Step 2</div>
            <h3 className="step-title">AI Analysis</h3>
            <p className="step-desc">Our algorithm finds unused accounts and spending patterns.</p>
            <ul className="step-list">
              <li>✓ ML-powered insights</li>
              <li>✓ Zero false positives</li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="step reveal reveal-delay-2">
            <div className="step-number">03</div>
            <div className="step-badge">Step 3</div>
            <h3 className="step-title">Optimize & Save</h3>
            <p className="step-desc">Act on recommendations with one click. Watch savings grow.</p>
            <ul className="step-list">
              <li>✓ Instant provisioning</li>
              <li>✓ ROI tracking</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section" id="pricing">
        <div className="section-label">PRICING</div>
        <h2 className="section-title">Simple, transparent pricing</h2>

        <div className="pricing-grid">
          {/* Free Tier */}
          <div className="pricing-card">
            <h3 className="pricing-title">Free</h3>
            <p className="pricing-desc">Perfect for startups</p>
            <div className="pricing-price">
              <span className="currency">$</span>
              <span className="amount">0</span>
              <span className="period">/mo</span>
            </div>
            <Button variant="ghost" block>
              Get Started
            </Button>
            <div className="pricing-features">
              <div className="pricing-feature">✓ Up to 10 apps</div>
              <div className="pricing-feature">✓ Basic analytics</div>
              <div className="pricing-feature">✓ Community support</div>
            </div>
          </div>

          {/* Pro Tier */}
          <div className="pricing-card featured">
            <div className="pricing-badge">Most popular</div>
            <h3 className="pricing-title">Pro</h3>
            <p className="pricing-desc">For growing teams</p>
            <div className="pricing-price">
              <span className="currency">$</span>
              <span className="amount">299</span>
              <span className="period">/mo</span>
            </div>
            <Button variant="primary" block>
              Start Free Trial
            </Button>
            <div className="pricing-features">
              <div className="pricing-feature">✓ Unlimited apps</div>
              <div className="pricing-feature">✓ Advanced AI insights</div>
              <div className="pricing-feature">✓ Team management</div>
              <div className="pricing-feature">✓ Priority support</div>
              <div className="pricing-feature">✓ SSO & SCIM</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner" id="contact">
        <div className="cta-content">
          <h2>Ready to eliminate SaaS waste?</h2>
          <p>Start tracking and optimizing your software spend today. Free for 14 days.</p>
          <Button variant="primary" size="lg" onClick={() => navigate('/register')}>
            Get started for free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="privacy">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <span className="logo-seat">Seat</span>
              <span className="logo-watch">Watch</span>
            </div>
            <p className="footer-tagline">Smart SaaS spend management</p>
          </div>

          <div className="footer-section">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#features">Docs</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><a href="#about">About</a></li>
              <li><a href="#about">Blog</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy</a></li>
              <li><a href="#terms">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom" id="terms">
          <p>&copy; 2024 SeatWatch. All rights reserved.</p>
          <div className="footer-social">
            <a href="https://twitter.com">Twitter</a>
            <a href="https://www.linkedin.com">LinkedIn</a>
            <a href="https://github.com">GitHub</a>
          </div>
        </div>
      </footer>
    </>
  );
}
