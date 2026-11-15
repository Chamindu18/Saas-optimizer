import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';
import { authAPI } from './services/api';

vi.mock('./pages/LoginPage', () => ({ default: () => <h1>Login route</h1> }));
vi.mock('./pages/DashboardPage', () => ({ default: () => <h1>Dashboard route</h1> }));

vi.mock('./services/api', () => ({
  default: { get: vi.fn(() => Promise.reject(new Error('Unexpected API request'))) },
  authAPI: { me: vi.fn(async () => ({ id: 1, name: 'Test User', email: 'test@example.com', role: 'viewer' })) },
}));

beforeEach(() => {
  window.localStorage.clear();
  window.history.pushState({}, '', '/');
});

test('redirects an unauthenticated dashboard visitor to login', async () => {
  window.history.pushState({}, '', '/dashboard');

  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Login route' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/login');
  expect(screen.queryByRole('heading', { name: 'Dashboard route' })).not.toBeInTheDocument();
});

test('renders the protected dashboard for a stored authenticated user', async () => {
  const payload = btoa(JSON.stringify({ userId: 1, role: 'viewer' }));
  window.localStorage.setItem('auth_token', `header.${payload}.signature`);
  window.localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test User', email: 'test@example.com', role: 'viewer' }));
  window.history.pushState({}, '', '/dashboard');

  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Dashboard route' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/dashboard');
  expect(screen.queryByRole('heading', { name: 'Login route' })).not.toBeInTheDocument();
});

test('rejects a stored token when session restoration fails', async () => {
  authAPI.me.mockRejectedValueOnce(new Error('Expired token'));
  window.localStorage.setItem('auth_token', 'expired');
  window.history.pushState({}, '', '/dashboard');
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Login route' })).toBeInTheDocument();
  expect(window.localStorage.getItem('auth_token')).toBeNull();
});

test('viewer navigation hides admin controls and cannot open admin route', async () => {
  window.localStorage.setItem('auth_token', 'viewer-token');
  window.history.pushState({}, '', '/admin');
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Dashboard route' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Admin Panel' })).not.toBeInTheDocument();
  expect(window.location.pathname).toBe('/dashboard');
});

test('public landing page describes the current manual MVP without a purchase flow', async () => {
  window.history.pushState({}, '', '/home');
  render(<App />);
  expect(await screen.findByRole('heading', { name: /Keep a clear record of software seats and spend/ })).toBeInTheDocument();
  expect(screen.getByText(/Activity dates are entered manually/)).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Create viewer account' }).length).toBeGreaterThan(0);
  expect(screen.queryByText(/Free Trial|\$299|500\+ integrations|AI Analysis/i)).not.toBeInTheDocument();
});
