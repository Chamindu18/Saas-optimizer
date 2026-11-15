import React from 'react';
import { Link } from 'react-router-dom';
import './styles/AuthExperience.css';

export default function AuthShell({ children }) {
  return <div className="sw-auth">
    <header className="sw-auth__header">
      <Link className="sw-auth__brand" to="/home" aria-label="SeatWatch home"><span className="sw-auth__mark" aria-hidden="true">S</span>SeatWatch</Link>
      <Link className="sw-auth__home" to="/home">Back to home</Link>
    </header>
    <main className="sw-auth__main"><div className="sw-auth__card">{children}</div></main>
    <footer className="sw-auth__footer">Software license records and estimated costs</footer>
  </div>;
}
