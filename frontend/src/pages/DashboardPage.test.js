import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import DashboardPage from './DashboardPage';
import { dashboardAPI, licenseAPI } from '../services/api';

vi.mock('../services/api', () => ({
  dashboardAPI: { getStats: vi.fn() },
  licenseAPI: { getAllLicenses: vi.fn() },
  apiErrorMessage: error => error.message,
}));

test('renders fixed-decimal monthly totals and authoritative license status', async () => {
  dashboardAPI.getStats.mockResolvedValue({ totalSpend: '120.50', activeLicenseCount: 1,
    idleLicenseCount: 0, prunedLicenseCount: 0, potentialSavings: '0.00', totalSoftware: 1 });
  licenseAPI.getAllLicenses.mockResolvedValue([{ id: 1, employeeName: 'Ana', softwareName: 'Editor',
    status: 'active', cost: '120.50', assigned_date: '2026-11-01', last_active_date: '2026-11-10' }]);
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
  expect(await screen.findByText('Ana')).toBeInTheDocument();
  expect(screen.getAllByText('$120.50').length).toBeGreaterThan(0);
  expect(screen.getByText('Pruned Licenses')).toBeInTheDocument();
});

test('shows an empty license state without inventing recent assignments', async () => {
  dashboardAPI.getStats.mockResolvedValue({ totalSpend: '0.00', activeLicenseCount: 0,
    idleLicenseCount: 0, prunedLicenseCount: 0, potentialSavings: '0.00', totalSoftware: 0 });
  licenseAPI.getAllLicenses.mockResolvedValue([]);
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
  expect(await screen.findByText(/No licenses assigned yet/)).toBeInTheDocument();
});
