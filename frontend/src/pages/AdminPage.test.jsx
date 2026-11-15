import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import AdminPage from './AdminPage';
import { adminAPI, userAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../services/api', () => ({
  adminAPI: { getAllUsers: vi.fn(), deleteUser: vi.fn(), updateUserRole: vi.fn(), getAuditLogs: vi.fn() },
  userAPI: { createAccount: vi.fn(), updateUser: vi.fn() },
  authAPI: { me: vi.fn() },
  apiErrorMessage: error => error.response?.data?.error || error.message,
}));
const admin = { id: 1, name: 'Admin', email: 'admin@example.test', role: 'admin', created_at: '2026-11-01' };
const viewer = { id: 2, name: 'Taylor', email: 'taylor@example.test', role: 'viewer', created_at: '2026-11-02' };
const mount = (path = '/admin') => render(<MemoryRouter initialEntries={[path]}><Routes>
  <Route path="/admin" element={<AdminPage />} /><Route path="/role-management" element={<AdminPage />} /><Route path="/audit-log" element={<AdminPage />} />
</Routes></MemoryRouter>);
const dialog = () => screen.getByRole('dialog');
beforeEach(() => {
  vi.resetAllMocks();
  useAuth.mockReturnValue({ user: admin, updateUser: vi.fn() });
  adminAPI.getAllUsers.mockResolvedValue([admin, viewer]);
  adminAPI.getAuditLogs.mockResolvedValue({ data: [], pagination: { page: 1, pages: 0, total: 0 } });
  authAPI.me.mockResolvedValue(admin);
});

test('account directory renders safe identity and role, with self and last-admin deletion blocked', async () => {
  mount();
  expect(await screen.findByRole('rowheader', { name: /Taylor/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Delete Admin' })).toBeDisabled();
  expect(screen.queryByText(/password_hash/)).not.toBeInTheDocument();
  expect(screen.getByText('Viewer')).toBeInTheDocument();
});
test('create validates password, sends viewer account contract, and clears password after submission', async () => {
  userAPI.createAccount.mockResolvedValue(viewer);
  mount();
  await screen.findByRole('rowheader', { name: /Taylor/ });
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
  expect(dialog()).toHaveAccessibleName('Create viewer account');
  const password = within(dialog()).getByLabelText(/Password/);
  expect(password).toHaveAttribute('type', 'password');
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Create viewer account' }));
  expect(within(dialog()).getByText('Enter at least 8 characters.')).toBeInTheDocument();
  fireEvent.change(within(dialog()).getByLabelText(/Name/), { target: { value: ' New User ' } });
  fireEvent.change(within(dialog()).getByLabelText(/Email/), { target: { value: 'new@example.test' } });
  fireEvent.change(password, { target: { value: 'long-secret' } });
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Create viewer account' }));
  await waitFor(() => expect(userAPI.createAccount).toHaveBeenCalledWith('New User', 'new@example.test', 'long-secret'));
  expect(await screen.findByRole('status')).toHaveTextContent('Viewer account created.');
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
  expect(within(dialog()).getByLabelText(/Password/)).toHaveValue('');
});
test('editing uses safe fields and updates current session profile', async () => {
  userAPI.updateUser.mockResolvedValue({ ...admin, name: 'Renamed' });
  const updateUser = vi.fn();
  useAuth.mockReturnValue({ user: admin, updateUser });
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Edit Admin' }));
  fireEvent.change(within(dialog()).getByLabelText(/Name/), { target: { value: 'Renamed' } });
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(userAPI.updateUser).toHaveBeenCalledWith(1, { name: 'Renamed', email: admin.email }));
  expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ name: 'Renamed', role: 'admin' }));
});
test('delete requires named dialog and server conflict remains visible', async () => {
  adminAPI.deleteUser.mockRejectedValue({ response: { status: 409, data: { error: 'Account is in use' } } });
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Delete Taylor' }));
  expect(dialog()).toHaveAccessibleDescription(/taylor@example.test/);
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Delete account' }));
  expect(await within(dialog()).findByRole('alert')).toHaveTextContent('Account is in use');
});
test('role change confirms proposed privilege, refreshes data, and blocks own role', async () => {
  adminAPI.updateUserRole.mockResolvedValue({ ...viewer, role: 'manager' });
  mount('/role-management');
  expect(await screen.findByRole('button', { name: 'Change role for Admin' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Change role for Taylor' }));
  expect(dialog()).toHaveAccessibleName('Change role for Taylor');
  fireEvent.change(within(dialog()).getByLabelText('Proposed role'), { target: { value: 'manager' } });
  expect(within(dialog()).getByText(/Managers can manage employees/)).toBeInTheDocument();
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Confirm role change' }));
  await waitFor(() => expect(adminAPI.updateUserRole).toHaveBeenCalledWith(2, 'manager'));
  expect(adminAPI.getAllUsers).toHaveBeenCalledTimes(2);
});
test('last administrator cannot be demoted and 403 role denial is announced', async () => {
  adminAPI.getAllUsers.mockResolvedValue([{ ...admin, id: 3 }, viewer]);
  useAuth.mockReturnValue({ user: { ...admin, id: 1 }, updateUser: vi.fn() });
  adminAPI.updateUserRole.mockRejectedValue({ response: { status: 403, data: { error: 'Denied' } } });
  mount('/role-management');
  expect(await screen.findByRole('button', { name: 'Change role for Admin' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Change role for Taylor' }));
  fireEvent.change(within(dialog()).getByLabelText('Proposed role'), { target: { value: 'admin' } });
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Confirm role change' }));
  expect(await within(dialog()).findByRole('alert')).toHaveTextContent('server denied');
});
test('server 400 last-admin protection remains authoritative after stale directory data', async () => {
  adminAPI.getAllUsers.mockResolvedValue([admin, { ...admin, id: 3, name: 'Second Admin', email: 'second@example.test' }]);
  adminAPI.updateUserRole.mockRejectedValue({ response: { status: 400, data: { error: 'Cannot demote the last admin' } } });
  mount('/role-management');
  fireEvent.click(await screen.findByRole('button', { name: 'Change role for Second Admin' }));
  fireEvent.change(within(dialog()).getByLabelText('Proposed role'), { target: { value: 'viewer' } });
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Confirm role change' }));
  expect(await within(dialog()).findByRole('alert')).toHaveTextContent('Cannot demote the last admin');
});
test('failed account creation clears password before retry and reports server validation', async () => {
  userAPI.createAccount.mockRejectedValue({ response: { status: 400, data: { error: 'Email already exists' } } });
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
  fireEvent.change(within(dialog()).getByLabelText(/Name/), { target: { value: 'New User' } });
  fireEvent.change(within(dialog()).getByLabelText(/Email/), { target: { value: 'new@example.test' } });
  fireEvent.change(within(dialog()).getByLabelText(/Password/), { target: { value: 'long-secret' } });
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Create viewer account' }));
  expect(await within(dialog()).findByRole('alert')).toHaveTextContent('Email already exists');
  expect(within(dialog()).getByLabelText(/Password/)).toHaveValue('');
});
test('403 rechecks the current session so external role changes can update route access', async () => {
  const updateUser = vi.fn();
  useAuth.mockReturnValue({ user: admin, updateUser });
  authAPI.me.mockResolvedValue({ ...admin, role: 'viewer' });
  adminAPI.deleteUser.mockRejectedValue({ response: { status: 403, data: { error: 'Forbidden' } } });
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Delete Taylor' }));
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Delete account' }));
  await waitFor(() => expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'viewer' })));
});
test('audit view requests each page in the server envelope and describes best-effort logging', async () => {
  adminAPI.getAuditLogs.mockResolvedValueOnce({ data: [{ id: 9, action: 'ROLE_CHANGE', user_name: 'Admin', target_name: 'Taylor', created_at: '2026-11-02', details: 'Changed role' }], pagination: { page: 1, pages: 2, total: 21 } })
    .mockResolvedValueOnce({ data: [], pagination: { page: 2, pages: 2, total: 21 } });
  mount('/audit-log');
  expect(await screen.findByRole('rowheader', { name: 'ROLE_CHANGE' })).toBeInTheDocument();
  expect(screen.getByText(/best effort/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  await waitFor(() => expect(adminAPI.getAuditLogs).toHaveBeenCalledWith({ page: 2, limit: 20, action: undefined }));
  expect(await screen.findByText('No recorded events')).toBeInTheDocument();
});
test('account load error has retry and dialog restores trigger focus after Escape', async () => {
  adminAPI.getAllUsers.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([admin, viewer]);
  mount();
  expect(await screen.findByText('Accounts could not be loaded')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry loading accounts' }));
  await screen.findByRole('rowheader', { name: /Taylor/ });
  const trigger = screen.getByRole('button', { name: 'Create account' });
  trigger.focus(); fireEvent.click(trigger);
  await waitFor(() => expect(within(dialog()).getByLabelText(/Name/)).toHaveFocus());
  fireEvent.keyDown(dialog(), { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(trigger).toHaveFocus();
});
