import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import App from './App';
import { authAPI } from './services/api';

vi.mock('./pages/LoginPage', () => ({ default: () => <h1>Login route</h1> }));
vi.mock('./pages/DashboardPage', () => ({ default: () => <h1>Dashboard route</h1> }));
vi.mock('./pages/UsersPage', () => ({ default: () => <h1>Employees route</h1> }));
vi.mock('./pages/SoftwarePage', () => ({ default: () => <h1>Software route</h1> }));
vi.mock('./pages/LicensesPage', () => ({ default: () => <h1>Licenses route</h1> }));
vi.mock('./pages/AdminPage', () => ({ default: () => <h1>Admin route</h1> }));

vi.mock('./services/api', () => ({
  default: { get: vi.fn(() => Promise.reject(new Error('Unexpected API request'))) },
  authAPI: { me: vi.fn(async () => ({ id: 1, name: 'Test User', email: 'test@example.com', role: 'viewer' })) },
}));

beforeEach(() => {
  authAPI.me.mockResolvedValue({ id: 1, name: 'Test User', email: 'test@example.com', role: 'viewer' });
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
  expect(screen.queryByRole('link', { name: 'Administration' })).not.toBeInTheDocument();
  expect(window.location.pathname).toBe('/dashboard');
});

test('sidebar links indicate the active route and navigate between protected pages', async () => {
  window.localStorage.setItem('auth_token', 'viewer-token');
  window.history.pushState({}, '', '/dashboard');
  render(<App />);
  const sidebar = await screen.findByRole('complementary', { name: 'SeatWatch sidebar' });
  expect(within(sidebar).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
  fireEvent.click(within(sidebar).getByRole('link', { name: 'Employees' }));
  expect(await screen.findByRole('heading', { name: 'Employees route' })).toBeInTheDocument();
  expect(within(sidebar).getByRole('link', { name: 'Employees' })).toHaveAttribute('aria-current', 'page');
  expect(within(sidebar).getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
});

test('admin navigation appears only for an admin session', async () => {
  authAPI.me.mockResolvedValueOnce({ id: 2, name: 'Admin', email: 'admin@example.com', role: 'admin' });
  window.localStorage.setItem('auth_token', 'admin-token');
  window.history.pushState({}, '', '/dashboard');
  render(<App />);
  const sidebar = await screen.findByRole('complementary', { name: 'SeatWatch sidebar' });
  expect(within(sidebar).getByRole('link', { name: 'Administration' })).toBeInTheDocument();
  expect(within(sidebar).getByRole('link', { name: 'Role management' })).toBeInTheDocument();
});

test('mobile navigation traps focus, closes with Escape, and restores focus', async () => {
  window.localStorage.setItem('auth_token', 'viewer-token');
  window.history.pushState({}, '', '/dashboard');
  render(<App />);
  const menu = await screen.findByRole('button', { name: 'Open navigation' });
  menu.focus();
  fireEvent.click(menu);
  const dialog = await screen.findByRole('dialog', { name: 'SeatWatch navigation' });
  expect(within(dialog).getByRole('link', { name: 'Employees' })).toBeInTheDocument();
  await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  fireEvent.keyDown(document.activeElement, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'SeatWatch navigation' })).not.toBeInTheDocument());
  expect(menu).toHaveFocus();
});

test('mobile navigation closes after route selection', async () => {
  window.localStorage.setItem('auth_token', 'viewer-token');
  window.history.pushState({}, '', '/dashboard');
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: 'Open navigation' }));
  fireEvent.click(within(screen.getByRole('dialog', { name: 'SeatWatch navigation' })).getByRole('link', { name: 'Software' }));
  expect(await screen.findByRole('heading', { name: 'Software route' })).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'SeatWatch navigation' })).not.toBeInTheDocument());
});

test('account menu signs out and clears the stored token', async () => {
  window.localStorage.setItem('auth_token', 'viewer-token');
  window.history.pushState({}, '', '/dashboard');
  render(<App />);
  const account = await screen.findByRole('button', { name: /Account menu for Test User/ });
  account.focus();
  fireEvent.keyDown(account, { key: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Sign out' }));
  expect(await screen.findByRole('heading', { name: 'Login route' })).toBeInTheDocument();
  expect(window.localStorage.getItem('auth_token')).toBeNull();
});

test('public landing page describes the current manual MVP without a purchase flow', async () => {
  window.history.pushState({}, '', '/home');
  render(<App />);
  expect(await screen.findByRole('heading', { name: /Keep a clear record of software seats and spend/ })).toBeInTheDocument();
  expect(screen.getByText(/Activity dates are entered manually/)).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Create viewer account' }).length).toBeGreaterThan(0);
  expect(screen.queryByText(/Free Trial|\$299|500\+ integrations|AI Analysis/i)).not.toBeInTheDocument();
});
