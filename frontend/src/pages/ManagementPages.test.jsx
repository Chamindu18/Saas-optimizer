import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import UsersPage from './UsersPage';
import SoftwarePage from './SoftwarePage';
import { employeeAPI, softwareAPI } from '../services/api';
import { useRole } from '../hooks/useRole';

vi.mock('../hooks/useRole', () => ({ useRole: vi.fn() }));
vi.mock('../services/api', () => ({
  employeeAPI: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  softwareAPI: { getAllSoftware: vi.fn(), createSoftware: vi.fn(), updateSoftware: vi.fn(), deleteSoftware: vi.fn() },
  apiErrorMessage: error => error.response?.data?.error || error.message,
}));
const employee = { id: 4, name: 'Alexandra Long Family Name', email: 'alexandra.long.address@example.test', created_at: '2026-11-01' };
const product = { id: 8, name: 'A Very Long Product Name', category: 'Design', price_per_seat: '0.00' };
const dialog = () => screen.getByRole('dialog');
beforeEach(() => {
  vi.resetAllMocks();
  useRole.mockReturnValue({ isManager: true, isAdmin: true });
  employeeAPI.getAll.mockResolvedValue([employee]);
  softwareAPI.getAllSoftware.mockResolvedValue([product]);
});

test('employee list has row identity, accessible actions and working search', async () => {
  render(<UsersPage />);
  expect(await screen.findByRole('rowheader', { name: employee.name })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: `Edit ${employee.name}` })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: `Delete ${employee.name}` })).toBeInTheDocument();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search employees' }), { target: { value: 'no match' } });
  expect(screen.getByText('No matching employees')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect(screen.getByRole('rowheader', { name: employee.name })).toBeInTheDocument();
});

test('employee creation validates, uses credential-free contract and announces success', async () => {
  render(<UsersPage />);
  await screen.findByRole('rowheader', { name: employee.name });
  fireEvent.click(screen.getByRole('button', { name: 'Add employee' }));
  expect(dialog()).toHaveAccessibleName('Add employee');
  expect(dialog()).toHaveAccessibleDescription(/do not provide login access/);
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Create employee' }));
  expect(within(dialog()).getByText('Name is required.')).toHaveAttribute('role', 'alert');
  fireEvent.change(within(dialog()).getByRole('textbox', { name: /Name/ }), { target: { value: ' Taylor ' } });
  fireEvent.change(within(dialog()).getByRole('textbox', { name: /Email/ }), { target: { value: 'taylor@example.test' } });
  employeeAPI.create.mockResolvedValue({});
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Create employee' }));
  await waitFor(() => expect(employeeAPI.create).toHaveBeenCalledWith('Taylor', 'taylor@example.test'));
  expect(await screen.findByRole('status')).toHaveTextContent('Employee created.');
});

test('employee edit preserves ID contract and server errors stay in dialog', async () => {
  employeeAPI.update.mockRejectedValueOnce({ response: { data: { error: 'Email already exists' } } });
  render(<UsersPage />);
  fireEvent.click(await screen.findByRole('button', { name: `Edit ${employee.name}` }));
  expect(within(dialog()).getByRole('textbox', { name: /Name/ })).toHaveValue(employee.name);
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Save changes' }));
  expect(await within(dialog()).findByRole('alert')).toHaveTextContent('Email already exists');
  expect(employeeAPI.update).toHaveBeenCalledWith(employee.id, employee.name, employee.email);
});

test('employee delete conflict keeps named confirmation open', async () => {
  employeeAPI.remove.mockRejectedValue({ response: { status: 409, data: { error: 'Employee has licenses' } } });
  render(<UsersPage />);
  fireEvent.click(await screen.findByRole('button', { name: `Delete ${employee.name}` }));
  expect(dialog()).toHaveAccessibleDescription(new RegExp(employee.name));
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Delete employee' }));
  expect(await within(dialog()).findByRole('alert')).toHaveTextContent('license history');
  expect(employeeAPI.remove).toHaveBeenCalledWith(employee.id);
});

test('viewer sees employee data without management actions', async () => {
  useRole.mockReturnValue({ isManager: false, isAdmin: false });
  render(<UsersPage />);
  expect(await screen.findByRole('rowheader', { name: employee.name })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Add employee|Edit |Delete / })).not.toBeInTheDocument();
});

test('software list shows actual zero price without currency code', async () => {
  render(<SoftwarePage />);
  expect(await screen.findByRole('rowheader', { name: product.name })).toBeInTheDocument();
  expect(screen.getByText('0.00')).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Monthly price per seat' })).toBeInTheDocument();
});

test('software creation validates price and uses current API contract', async () => {
  softwareAPI.createSoftware.mockResolvedValue({});
  render(<SoftwarePage />);
  await screen.findByRole('rowheader', { name: product.name });
  fireEvent.click(screen.getByRole('button', { name: 'Add software' }));
  fireEvent.change(within(dialog()).getByRole('textbox', { name: /Software name/ }), { target: { value: 'Editor' } });
  fireEvent.change(within(dialog()).getByRole('textbox', { name: /Category/ }), { target: { value: 'Design' } });
  fireEvent.change(within(dialog()).getByRole('textbox', { name: /Monthly price per seat/ }), { target: { value: '-1' } });
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Create software' }));
  expect(within(dialog()).getByRole('alert')).toHaveTextContent('nonnegative');
  expect(softwareAPI.createSoftware).not.toHaveBeenCalled();
  fireEvent.change(within(dialog()).getByRole('textbox', { name: /Monthly price per seat/ }), { target: { value: '0' } });
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Create software' }));
  await waitFor(() => expect(softwareAPI.createSoftware).toHaveBeenCalledWith('Editor', 'Design', 0));
});

test('software editing and delete conflicts use API IDs and retain dialog', async () => {
  softwareAPI.updateSoftware.mockResolvedValue({});
  softwareAPI.deleteSoftware.mockRejectedValue({ response: { status: 409 } });
  render(<SoftwarePage />);
  fireEvent.click(await screen.findByRole('button', { name: `Edit ${product.name}` }));
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(softwareAPI.updateSoftware).toHaveBeenCalledWith(product.id, { name: product.name, category: product.category, price_per_seat: 0 }));
  fireEvent.click(screen.getByRole('button', { name: `Delete ${product.name}` }));
  fireEvent.click(within(dialog()).getByRole('button', { name: 'Delete software' }));
  expect(await within(dialog()).findByRole('alert')).toHaveTextContent('license history');
});

test('manager can edit software but cannot delete it', async () => {
  useRole.mockReturnValue({ isManager: true, isAdmin: false });
  render(<SoftwarePage />);
  expect(await screen.findByRole('button', { name: `Edit ${product.name}` })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: `Delete ${product.name}` })).not.toBeInTheDocument();
});

test('empty and failed loads provide distinct recovery states', async () => {
  employeeAPI.getAll.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('offline'));
  const view = render(<UsersPage />);
  expect(await screen.findByText('No employees yet')).toBeInTheDocument();
  view.unmount();
  render(<UsersPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('offline');
  fireEvent.click(screen.getByRole('button', { name: 'Retry loading employees' }));
  expect(await screen.findByRole('rowheader', { name: employee.name })).toBeInTheDocument();
});

test('Escape closes the form dialog', async () => {
  render(<UsersPage />);
  await screen.findByRole('rowheader', { name: employee.name });
  fireEvent.click(screen.getByRole('button', { name: 'Add employee' }));
  fireEvent.keyDown(dialog(), { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});
