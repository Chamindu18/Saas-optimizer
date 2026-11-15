import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChartNoAxesCombined, ClipboardList, Menu, MonitorCheck, UsersRound, X } from 'lucide-react';
import './styles/HomePage.css';

const features = [
  { icon: UsersRound, title: 'Keep inventory organized', description: 'Maintain employee and software records in one shared organizational workspace.' },
  { icon: ClipboardList, title: 'Track assigned seats', description: 'Record which employee holds each software license and when activity was last recorded.' },
  { icon: MonitorCheck, title: 'Review idle licenses', description: 'See assignments classified idle under the 30-day rule. Activity dates are entered manually.' },
  { icon: ChartNoAxesCombined, title: 'Estimate the cost', description: 'Review estimated monthly spending and potential savings from recorded seat prices.' },
];
const steps = [
  { title: 'Record', description: 'A manager or admin adds employees, software, and estimated monthly seat prices.' },
  { title: 'Assign', description: 'Record license assignments and update activity dates from information available to your team.' },
  { title: 'Review', description: 'Inspect idle seats and estimated potential savings before deciding what to change.' },
];

function ProductIllustration() {
  return <figure className="sw-landing__preview">
    <div className="sw-landing__preview-top"><strong>SeatWatch</strong><span>Workspace overview</span></div>
    <div className="sw-landing__preview-body" role="img" aria-label="Illustration of the SeatWatch workspace with employee records, software inventory, license assignments, and idle seat review. No account or usage data is shown.">
      <div className="sw-landing__preview-sidebar" aria-hidden="true"><b>Overview</b><span>Employees</span><span>Software</span><span>Licenses</span></div>
      <div className="sw-landing__preview-main" aria-hidden="true">
        <small>WORKSPACE OVERVIEW</small><h3>Software seats at a glance</h3>
        <div className="sw-landing__preview-metrics"><div><span>Monthly spending</span><strong>Estimated from records</strong></div><div><span>Potential savings</span><strong>Review idle seats</strong></div></div>
        <div className="sw-landing__preview-table"><strong>License assignments</strong><div className="sw-landing__preview-row sw-landing__preview-row--head"><span>Employee</span><span>Software</span><span>Status</span></div><div className="sw-landing__preview-row"><span>Assignment record</span><span>Software seat</span><span>Review status</span></div></div>
      </div>
    </div>
    <figcaption>Illustrative product preview · no live or customer data</figcaption>
  </figure>;
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = event => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);
  return <div className="sw-landing">
    <header className="sw-landing__header"><div className="sw-landing__header-inner">
      <Link className="sw-landing__brand" to="/home" aria-label="SeatWatch home"><span className="sw-landing__brand-mark" aria-hidden="true">S</span>SeatWatch</Link>
      <nav className="sw-landing__desktop-nav" aria-label="Main navigation"><a href="#features">Features</a><a href="#how-it-works">How it works</a></nav>
      <div className="sw-landing__header-actions"><Link className="sw-landing__text-action" to="/login">Sign in</Link><Link className="sw-landing__button sw-landing__button--primary" to="/register">Create viewer account</Link></div>
      <button ref={menuButton} className="sw-landing__menu-toggle" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-controls="sw-landing-mobile-nav" aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}</button>
    </div>{menuOpen && <nav id="sw-landing-mobile-nav" className="sw-landing__mobile-nav" aria-label="Mobile navigation"><a href="#features" onClick={() => setMenuOpen(false)}>Features</a><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a><Link to="/login" onClick={() => setMenuOpen(false)}>Sign in</Link><Link className="sw-landing__button sw-landing__button--primary" to="/register" onClick={() => setMenuOpen(false)}>Create viewer account</Link></nav>}</header>
    <main id="main-content">
      <section className="sw-landing__hero"><div className="sw-landing__container sw-landing__hero-grid">
        <div className="sw-landing__hero-copy"><p className="sw-landing__eyebrow">License management MVP</p><h1>Know where your software licenses go.</h1><p className="sw-landing__lead">Track assignments, identify seats that may be unused, and estimate monthly software spending in one organized workspace.</p><div className="sw-landing__hero-actions"><Link className="sw-landing__button sw-landing__button--primary" to="/register">Create viewer account <ArrowRight size={17} aria-hidden="true" /></Link><Link className="sw-landing__button sw-landing__button--secondary" to="/login">Sign in</Link></div><p className="sw-landing__hero-note">Registration gives viewer access to the shared workspace.</p></div>
        <ProductIllustration />
      </div></section>
      <section className="sw-landing__section sw-landing__features" id="features" aria-labelledby="features-title"><div className="sw-landing__container"><div className="sw-landing__section-intro"><p className="sw-landing__eyebrow">WHAT YOU CAN TRACK</p><h2 id="features-title">A clearer record of every seat</h2><p>Bring the records you already maintain into a single view for assignment and cost review.</p></div><div className="sw-landing__feature-grid">{features.map(({ icon: Icon, title, description }) => <article className="sw-landing__feature" key={title}><Icon size={21} strokeWidth={1.8} aria-hidden="true" /><h3>{title}</h3><p>{description}</p></article>)}</div></div></section>
      <section className="sw-landing__section sw-landing__workflow" id="how-it-works" aria-labelledby="workflow-title"><div className="sw-landing__container"><div className="sw-landing__section-intro"><p className="sw-landing__eyebrow">HOW IT WORKS</p><h2 id="workflow-title">From records to review</h2><p>A simple workflow for keeping license assignments visible.</p></div><ol className="sw-landing__steps">{steps.map((step, index) => <li key={step.title}><span className="sw-landing__step-number">{String(index + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.description}</p></li>)}</ol></div></section>
      <section className="sw-landing__final" aria-labelledby="final-title"><div className="sw-landing__container sw-landing__final-inner"><div><p className="sw-landing__eyebrow">GET STARTED</p><h2 id="final-title">See the workspace for yourself.</h2><p>Create a viewer account to inspect the shared inventory. An admin manages permissions for changes.</p></div><div className="sw-landing__final-actions"><Link className="sw-landing__button sw-landing__button--primary" to="/register">Create viewer account <ArrowRight size={17} aria-hidden="true" /></Link><Link className="sw-landing__text-action" to="/login">Already have an account? Sign in</Link></div></div></section>
    </main>
    <footer className="sw-landing__footer"><div className="sw-landing__container sw-landing__footer-inner"><p><strong>SeatWatch</strong><span>Software license records and estimated costs</span></p><nav aria-label="Footer navigation"><a href="#features">Features</a><a href="#how-it-works">How it works</a><Link to="/login">Sign in</Link></nav></div></footer>
  </div>;
}
