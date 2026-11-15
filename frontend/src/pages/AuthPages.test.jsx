import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

const login = vi.fn();
const register = vi.fn();
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ login, register }) }));
vi.mock('../components/ui/ToastContainer', () => ({ useToast: () => ({ addToast: vi.fn() }) }));
vi.mock('../services/api', () => ({ apiErrorMessage: error => error.message }));
beforeEach(() => { login.mockReset(); register.mockReset(); });
const show = Page => render(<MemoryRouter><Page /></MemoryRouter>);

test('login has accessible fields, navigation, keyboard password toggle and required errors', () => {
  show(LoginPage);
  expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  expect(screen.getByText(/Accounts are provided by your organization's administrator/)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Create viewer account/ })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/home');
  expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'username');
  const password = screen.getByLabelText('Password');
  expect(password).toHaveAttribute('type', 'password');
  const toggle = screen.getByRole('button', { name: 'Show password' });
  toggle.focus();
  fireEvent.keyDown(toggle, { key: 'Enter' });
  fireEvent.click(toggle);
  expect(password).toHaveAttribute('type', 'text');
  expect(screen.getByRole('button', { name: 'Hide password' })).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(screen.getByText('Email is required')).toHaveAttribute('role', 'alert');
  expect(login).not.toHaveBeenCalled();
});

test('login keeps submission busy and announces endpoint errors', async () => {
  let reject;
  login.mockImplementation(() => new Promise((_, fail) => { reject = fail; }));
  show(LoginPage);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'viewer@example.test' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
  expect(login).toHaveBeenCalledWith('viewer@example.test', 'password123');
  reject(new Error('Invalid credentials'));
  expect(await screen.findByText('Invalid credentials')).toHaveAttribute('role', 'alert');
});

test('registration route explains administrator-provided access without a signup form', () => {
  show(RegisterPage);
  expect(screen.getByRole('heading', { name: 'Access is provided by your administrator' })).toBeInTheDocument();
  expect(screen.getByText(/Accounts are provided by your organization's administrator/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  expect(screen.queryByRole('form')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Create/ })).not.toBeInTheDocument();
  expect(register).not.toHaveBeenCalled();
});

test('login reports network failure and prevents repeated submission while busy', async () => {
  let reject;
  login.mockImplementation(() => new Promise((_, fail) => { reject = fail; }));
  show(LoginPage);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'viewer@example.test' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  fireEvent.click(screen.getByRole('button', { name: 'Signing in…' }));
  expect(login).toHaveBeenCalledTimes(1);
  reject(new Error('Network Error'));
  expect(await screen.findByText('Network Error')).toHaveAttribute('role', 'alert');
});
