import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./pages/LoginPage', () => () => <h1>Login route</h1>);
jest.mock('./pages/DashboardPage', () => () => <h1>Dashboard route</h1>);

jest.mock('./services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(() => Promise.reject(new Error('Unexpected API request'))) },
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
