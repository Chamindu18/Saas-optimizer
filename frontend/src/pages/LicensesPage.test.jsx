import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import LicensesPage from './LicensesPage';
import { employeeAPI, licenseAPI, softwareAPI } from '../services/api';
import { useRole } from '../hooks/useRole';

vi.mock('../hooks/useRole', () => ({ useRole: vi.fn() }));
vi.mock('../services/api', () => ({
  employeeAPI: { getAll: vi.fn() },
  softwareAPI: { getAllSoftware: vi.fn() },
  licenseAPI: { getAllLicenses: vi.fn(), assignLicense: vi.fn(), pruneLicense: vi.fn(), reactivateLicense: vi.fn() },
  apiErrorMessage: error => error.response?.data?.error || error.message,
}));
const active = { id: 1, employeeName: 'Alex Morgan', employeeEmail: 'alex@example.test', softwareName: 'Figma', cost: '12345678.90', status: 'active', last_active_date: null, assigned_date: '2026-11-01T12:00:00Z' };
const idle = { id: 2, employeeName: 'Sam Idle', softwareName: 'Docs', cost: '5.00', status: 'idle', last_active_date: '2026-09-01T12:00:00Z' };
const pruned = { id: 3, employeeName: 'Taylor Lee', softwareName: 'Editor', cost: '0.00', status: 'pruned', last_active_date: null };
const dialog = () => screen.getByRole('dialog');
beforeEach(() => {
  vi.resetAllMocks();
  useRole.mockReturnValue({ isManager: true, isAdmin: true });
  licenseAPI.getAllLicenses.mockResolvedValue([active, idle, pruned]);
  employeeAPI.getAll.mockResolvedValue([{ id: 4, name: 'Alex Morgan', email: 'alex@example.test' }]);
  softwareAPI.getAllSoftware.mockResolvedValue([{ id: 5, name: 'Figma' }]);
});
test('renders effective statuses, names, dates and exact monthly amounts', async () => {
  render(<LicensesPage />);
  expect(await screen.findByRole('rowheader', { name: /Alex Morgan/ })).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: '12,345,678.90' })).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: '0.00' })).toBeInTheDocument();
  expect(screen.getAllByText('Not recorded').length).toBeGreaterThan(0);
  expect(screen.getByRole('region', { name: 'License status summary' })).toHaveTextContent('Idle1');
  expect(screen.queryByText(/realized savings/i)).not.toBeInTheDocument();
});
test('search and status filters narrow the actual list and reset', async () => {
  render(<LicensesPage />); await screen.findByRole('rowheader', { name: /Alex Morgan/ });
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search licenses' }), { target: { value: 'docs' } });
  expect(screen.getByRole('rowheader', { name: /Sam Idle/ })).toBeInTheDocument();
  expect(screen.queryByRole('rowheader', { name: /Alex Morgan/ })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'pruned' } });
  expect(screen.getByText('No matching licenses')).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: 'Reset filters' })[0]);
  expect(screen.getByRole('rowheader', { name: /Alex Morgan/ })).toBeInTheDocument();
});
test('assignment validates selections, uses employee ID and announces success', async () => {
  licenseAPI.assignLicense.mockResolvedValue({});
  render(<LicensesPage />); await screen.findByRole('rowheader', { name: /Alex Morgan/ });
  fireEvent.click(screen.getByRole('button', { name: 'Assign License' }));
  expect(dialog()).toHaveAccessibleDescription(/No login account/);
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Assign License' }));
  expect(within(dialog()).getAllByRole('alert')).toHaveLength(2);
  fireEvent.change(within(dialog()).getByRole('combobox', { name: 'Employee' }), { target: { value: '4' } });
  fireEvent.change(within(dialog()).getByRole('combobox', { name: 'Software' }), { target: { value: '5' } });
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Assign License' }));
  await waitFor(() => expect(licenseAPI.assignLicense).toHaveBeenCalledWith(4, 5));
  expect(await screen.findByRole('status', { name: '' })).toHaveTextContent('License assigned.');
});
test('duplicate assignment stays in dialog with useful feedback', async () => {
  licenseAPI.assignLicense.mockRejectedValue({ response: { status: 409, data: { error: 'License already assigned' } } });
  render(<LicensesPage />); await screen.findByRole('rowheader', { name: /Alex Morgan/ });
  fireEvent.click(screen.getByRole('button', { name: 'Assign License' }));
  fireEvent.change(within(dialog()).getByRole('combobox', { name: 'Employee' }), { target: { value: '4' } });
  fireEvent.change(within(dialog()).getByRole('combobox', { name: 'Software' }), { target: { value: '5' } });
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Assign License' }));
  expect(await within(dialog()).findByRole('alert')).toHaveTextContent('already has an assignment');
});
test('prune confirms named seat, handles error, and refreshes on success', async () => {
  licenseAPI.pruneLicense.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({});
  render(<LicensesPage />); fireEvent.click(await screen.findByRole('button', { name: 'Prune Alex Morgan — Figma' }));
  expect(dialog()).toHaveAccessibleDescription(/Figma for Alex Morgan/);
  expect(dialog()).toHaveTextContent('does not cancel vendor billing');
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Prune license' }));
  expect(await within(dialog()).findByRole('alert')).toHaveTextContent('offline');
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Prune license' }));
  await waitFor(() => expect(licenseAPI.pruneLicense).toHaveBeenCalledTimes(2));
  expect(licenseAPI.getAllLicenses).toHaveBeenCalledTimes(2);
});
test('reactivation rejects missing, future and stale dates without API call', async () => {
  render(<LicensesPage />); fireEvent.click(await screen.findByRole('button', { name: 'Reactivate Taylor Lee — Editor' }));
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Reactivate license' }));
  expect(within(dialog()).getByRole('alert')).toHaveTextContent('not in the future');
  fireEvent.change(within(dialog()).getByLabelText(/^Manually recorded activity date and time/), { target: { value: '2099-01-01T12:00' } });
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Reactivate license' }));
  expect(within(dialog()).getByRole('alert')).toHaveTextContent('not in the future');
  fireEvent.change(within(dialog()).getByLabelText(/^Manually recorded activity date and time/), { target: { value: '2020-01-01T12:00' } });
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Reactivate license' }));
  expect(within(dialog()).getByRole('alert')).toHaveTextContent('within the past 30 days');
  expect(licenseAPI.reactivateLicense).not.toHaveBeenCalled();
});
test('reactivation sends explicit recent ISO activity and refreshes', async () => {
  licenseAPI.reactivateLicense.mockResolvedValue({});
  render(<LicensesPage />); fireEvent.click(await screen.findByRole('button', { name: 'Reactivate Taylor Lee — Editor' }));
  const recent = new Date(Date.now() - 86400000);
  const local = new Date(recent.getTime() - recent.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  fireEvent.change(within(dialog()).getByLabelText(/^Manually recorded activity date and time/), { target: { value: local } });
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Reactivate license' }));
  await waitFor(() => expect(licenseAPI.reactivateLicense).toHaveBeenCalledWith(3, expect.stringMatching(/^\d{4}-/)));
  expect(licenseAPI.getAllLicenses).toHaveBeenCalledTimes(2);
});
test('viewer sees data without mutation actions', async () => {
  useRole.mockReturnValue({ isManager: false, isAdmin: false });
  render(<LicensesPage />); await screen.findByRole('rowheader', { name: /Alex Morgan/ });
  expect(screen.queryByRole('button', { name: 'Assign License' })).not.toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument();
});
test('loading, empty and failed loading have visible states and retry', async () => {
  licenseAPI.getAllLicenses.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
  render(<LicensesPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('offline');
  fireEvent.click(screen.getByRole('button', { name: 'Retry loading licenses' }));
  expect(await screen.findByText('No licenses yet')).toBeInTheDocument();
});
test('missing assignment options disable submission', async () => {
  employeeAPI.getAll.mockResolvedValue([]);
  render(<LicensesPage />); await screen.findByRole('rowheader', { name: /Alex Morgan/ });
  fireEvent.click(screen.getByRole('button', { name: 'Assign License' }));
  expect(within(dialog()).getByText(/No employees are available/)).toBeInTheDocument();
  expect(within(dialog()).getByRole('button', { name: 'Assign License' })).toBeDisabled();
});
test('assignment dialog moves focus inside and returns it after Escape', async () => {
  render(<LicensesPage />);
  await screen.findByRole('rowheader', { name: /Alex Morgan/ });
  const trigger = screen.getByRole('button', { name: 'Assign License' });
  trigger.focus(); fireEvent.click(trigger);
  expect(dialog().contains(document.activeElement)).toBe(true);
  fireEvent.keyDown(document.activeElement, { key: 'Escape', code: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(document.activeElement).toBe(trigger);
});

