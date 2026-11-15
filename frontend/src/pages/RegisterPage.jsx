import React from 'react';
import { Link } from 'react-router-dom';
import AuthShell from './AuthShell';

export default function RegisterPage() {
  return <AuthShell>
    <p className="sw-auth__eyebrow">Account access</p>
    <h1>Access is provided by your administrator</h1>
    <p className="sw-auth__intro">Accounts are provided by your organization's administrator. Ask your administrator for access to the SeatWatch workspace.</p>
    <Link className="sw-auth__submit" to="/login">Sign in</Link>
  </AuthShell>;
}
