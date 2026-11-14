import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import './styles/HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <>
      <nav className="landing-nav" aria-label="Main navigation">
        <div className="nav-logo"><span className="logo-seat">Seat</span><span className="logo-watch">Watch</span></div>
        <div className="nav-links"><a href="#features">Features</a><a href="#about">How it works</a></div>
        <div className="nav-actions">
          <Button variant="ghost" onClick={() => navigate('/login')}>Sign in</Button>
          <Button variant="primary" onClick={() => navigate('/register')}>Create viewer account</Button>
        </div>
      </nav>
      <main>
        <section className="hero"><div className="hero-grid">
          <div className="hero-copy">
            <div className="hero-badge">License management MVP</div>
            <h1 className="hero-title"><span className="hero-line-1">Keep a clear record of</span><span className="hero-line-2">software seats and spend</span></h1>
            <p className="hero-subtitle">Record employees, software, monthly seat prices, and assignments. Review licenses with activity dates older than 30 days and estimate potential monthly savings.</p>
            <div className="hero-cta"><Button variant="primary" size="lg" onClick={() => navigate('/register')}>Create viewer account</Button><button className="cta-link" onClick={() => navigate('/login')}>Sign in to the dashboard →</button></div>
          </div>
          <div className="hero-visual"><div className="preview-card"><div className="preview-header"><div className="preview-dot"/><div className="preview-dot"/><div className="preview-dot"/></div><div className="preview-content"><div className="preview-metric"><div className="preview-label">Record</div><div className="preview-value">Employees &amp; software</div></div><div className="preview-metric"><div className="preview-label">Review</div><div className="preview-value">Assigned &amp; idle seats</div></div></div></div><div className="preview-glow"/></div>
        </div></section>
        <section className="features-section" id="features"><div className="section-label">CURRENT FEATURES</div><h2 className="section-title">See what is recorded in SeatWatch</h2><div className="features-grid">
          <div className="feature-card"><h3 className="feature-title">License assignments</h3><p className="feature-desc">Managers and admins can assign a software seat to an employee. Employees do not need login credentials.</p></div>
          <div className="feature-card"><h3 className="feature-title">Idle license report</h3><p className="feature-desc">SeatWatch flags seats when their recorded last activity is at least 30 days old. Activity dates are entered manually; there is no external usage feed.</p></div>
          <div className="feature-card"><h3 className="feature-title">Estimated monthly spend</h3><p className="feature-desc">The dashboard calculates current spend and potential savings from recorded monthly seat prices. These are estimates, not confirmed billing changes.</p></div>
        </div></section>
        <section className="how-it-works" id="about"><div className="section-label">WORKFLOW</div><h2 className="section-title">How it works</h2><div className="steps-container">
          <div className="step"><div className="step-number">01</div><h3 className="step-title">Record your inventory</h3><p className="step-desc">An authorized manager or admin adds employees and software with estimated monthly seat prices.</p></div>
          <div className="step"><div className="step-number">02</div><h3 className="step-title">Assign and review</h3><p className="step-desc">Assign seats to employees and update activity dates from information you have verified.</p></div>
          <div className="step"><div className="step-number">03</div><h3 className="step-title">Prune a seat</h3><p className="step-desc">An admin can mark an assignment as pruned. The history remains; vendor billing must be handled separately.</p></div>
        </div></section>
        <section className="cta-banner"><div className="cta-content"><h2>Explore the current SeatWatch workflow</h2><p>Registration creates a viewer account. An admin manages access for inventory changes.</p><Button variant="primary" size="lg" onClick={() => navigate('/register')}>Create viewer account</Button></div></section>
      </main>
      <footer className="footer"><div className="footer-bottom"><p>SeatWatch · License management MVP</p><a href="#features">Features</a></div></footer>
    </>
  );
}
