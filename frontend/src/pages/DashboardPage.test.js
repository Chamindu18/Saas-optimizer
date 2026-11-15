import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import DashboardPage from './DashboardPage';
import { dashboardAPI, licenseAPI } from '../services/api';

vi.mock('../services/api', () => ({
  dashboardAPI: { getStats: vi.fn() },
  licenseAPI: { getAllLicenses: vi.fn() },
  apiErrorMessage: error => error.message,
}));
const stats = { totalSpend: '120.50', potentialSavings: '20.50', activeLicenseCount: 1,
  idleLicenseCount: 1, prunedLicenseCount: 2, savingsPercentage: '17.01', totalSoftware: 2,
  spendingByCategory: [{ category: 'Design', monthlySpend: '120.50' }] };
const assignment = { id: 1, employeeName: 'Ana', softwareName: 'Editor', status: 'idle',
  cost: '20.50', assignedDate: '2026-11-01', lastActivityDate: null };
const show = () => render(<MemoryRouter><DashboardPage /></MemoryRouter>);
beforeEach(() => { vi.resetAllMocks(); dashboardAPI.getStats.mockResolvedValue(stats); licenseAPI.getAllLicenses.mockResolvedValue([assignment]); });

test('shows API totals, category breakdown, counts, and unknown activity without a currency claim', async () => {
  show();
  expect((await screen.findAllByText('Ana')).length).toBe(2);
  expect(screen.getAllByText('120.50').length).toBeGreaterThan(0);
  expect(screen.getAllByText('20.50').length).toBeGreaterThan(0);
  expect(screen.getByText('Pruned licenses')).toBeInTheDocument();
  expect(screen.getByText('17.01%')).toBeInTheDocument();
  expect(screen.getByText('Design')).toBeInTheDocument();
  expect(screen.getByText('Not recorded')).toBeInTheDocument();
  expect(screen.queryByText('$120.50')).not.toBeInTheDocument();
  expect(within(screen.getByRole('list', { name: 'Monthly spending by category' })).getByText('Design')).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: /Manage licenses/ })).toHaveLength(2);
});

test('handles zero spend and an empty dashboard', async () => {
  dashboardAPI.getStats.mockResolvedValue({ ...stats, totalSpend: '0.00', potentialSavings: '0.00',
    activeLicenseCount: 0, idleLicenseCount: 0, prunedLicenseCount: 0, savingsPercentage: '0.00', spendingByCategory: [] });
  licenseAPI.getAllLicenses.mockResolvedValue([]);
  show();
  expect(await screen.findByText('No idle licenses found.', { exact: false })).toBeInTheDocument();
  expect(screen.getByText('No category spending to show yet.')).toBeInTheDocument();
  expect(screen.getAllByText('0.00').length).toBe(2);
});

test('announces loading, reports API errors, and retries', async () => {
  let resolveStats;
  dashboardAPI.getStats.mockImplementationOnce(() => new Promise(resolve => { resolveStats = resolve; }))
    .mockRejectedValueOnce(new Error('offline')).mockResolvedValue(stats);
  show();
  expect(screen.getByText('Loading dashboard data…')).toBeInTheDocument();
  await act(async () => { resolveStats(stats); });
  await screen.findAllByText('120.50', { exact: false });
  fireEvent.click(screen.getByRole('button', { name: 'Refresh dashboard data' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('offline');
  fireEvent.click(screen.getByRole('button', { name: 'Retry metrics' }));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  expect(dashboardAPI.getStats).toHaveBeenCalledTimes(3);
});

test('marks idle status and provides license navigation', async () => {
  show();
  expect((await screen.findAllByText('Ana')).length).toBe(2);
  expect(screen.getAllByText('idle').length).toBeGreaterThan(0);
  expect(screen.getAllByRole('link', { name: /Manage licenses/ }).every(link => link.getAttribute('href') === '/licenses')).toBe(true);
  expect(screen.getByRole('button', { name: 'Refresh dashboard data' })).toBeEnabled();
});

test('retains large fixed-decimal digits and long API labels', async () => {
  dashboardAPI.getStats.mockResolvedValue({ ...stats, totalSpend: '12345678901234567890.12',
    spendingByCategory: [{ category: 'Very long category name that must wrap in a narrow dashboard panel', monthlySpend: '12345678901234567890.12' }] });
  licenseAPI.getAllLicenses.mockResolvedValue([{ ...assignment, employeeName: 'Alexandra Extremelylongfamilyname',
    softwareName: 'Software with a long descriptive name' }]);
  show();
  expect((await screen.findAllByText('12,345,678,901,234,567,890.12')).length).toBe(2);
  expect(screen.getByText('Very long category name that must wrap in a narrow dashboard panel')).toBeInTheDocument();
  expect(screen.getAllByText('Alexandra Extremelylongfamilyname')).toHaveLength(2);
});

test('reports assignment errors and offers a separate retry', async () => {
  licenseAPI.getAllLicenses.mockRejectedValueOnce(new Error('assignments offline')).mockResolvedValue([assignment]);
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('assignments offline');
  fireEvent.click(screen.getByRole('button', { name: 'Retry assignments' }));
  expect((await screen.findAllByText('Ana')).length).toBe(2);
  expect(licenseAPI.getAllLicenses).toHaveBeenCalledTimes(2);
});
