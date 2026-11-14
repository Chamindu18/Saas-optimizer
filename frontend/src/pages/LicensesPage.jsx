/**
 * LICENSES PAGE
 * License assignment and management
 */

import React, { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { useForm } from '../hooks/useForm';
import { licenseAPI, employeeAPI, softwareAPI } from '../services/api';
import { useRole } from '../hooks/useRole';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Badge from '../components/common/Badge';
import { daysSinceDate, capitalize } from '../utils/formatters';
import './ManagementPages.css';

function LicensesPage() {
  const { isManager, isAdmin } = useRole();
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  const { data: licenses, isLoading, execute: refetch } = useAsync(
    () => licenseAPI.getAllLicenses(),
    true
  );

  const { data: employees } = useAsync(() => employeeAPI.getAll(), true);
  const { data: software } = useAsync(() => softwareAPI.getAllSoftware(), true);

  const validate = (values) => {
    const errors = {};
    if (!values.employee_id) errors.employee_id = 'Employee is required';
    if (!values.software_id) errors.software_id = 'Software is required';
    return errors;
  };

  const form = useForm(
    { employee_id: '', software_id: '' },
    async (values) => {
      try {
        await licenseAPI.assignLicense(values.employee_id, values.software_id);
        setShowModal(false);
        form.reset();
        refetch();
      } catch (err) {
        setError(err.message);
      }
    },
    validate
  );

  const handleRevoke = async (id) => {
    if (window.confirm('Revoke this license?')) {
      try {
        await licenseAPI.revokeLicense(id);
        refetch();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  if (isLoading) return <Spinner text="Loading licenses..." />;

  return (
    <div className="management-page">
      <div className="management-header">
        <h1>Licenses</h1>
        {isManager && <Button onClick={() => setShowModal(true)}>Assign License</Button>}
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <Card>
        <Table
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'employee_id', label: 'Employee ID' },
            { key: 'software_id', label: 'Software ID' },
            {
              key: 'status',
              label: 'Status',
              render: (status) => (
                <Badge
                  variant={status === 'active' ? 'success' : status === 'idle' ? 'warning' : 'danger'}
                >
                  {capitalize(status)}
                </Badge>
              ),
            },
            {
              key: 'last_active_date',
              label: 'Last Active',
              render: (date) => {
                if (!date) return '-';
                const days = daysSinceDate(date);
                return `${days} days ago`;
              },
            },
            ...(isAdmin ? [{
              key: 'actions',
              label: 'Actions',
              render: (_, row) => (
                <Button variant="ghost" size="sm" onClick={() => handleRevoke(row.id)}>
                  Revoke
                </Button>
              ),
            }] : []),
          ]}
          data={licenses || []}
        />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        title="Assign License"
        onClose={() => setShowModal(false)}
        size="md"
        actions={
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="license-form" loading={form.isSubmitting}>
              Assign License
            </Button>
          </div>
        }
      >
        <form id="license-form" onSubmit={form.handleSubmit}>
          <div className="form-group">
            <label htmlFor="employee_id">Employee</label>
            <select
              id="employee_id"
              name="employee_id"
              value={form.values.employee_id}
              onChange={form.handleChange}
              className="form-select"
              required
            >
              <option value="">Select an employee...</option>
              {employees?.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.email})
                </option>
              ))}
            </select>
            {form.errors.employee_id && <p style={{ color: 'var(--color-danger-600)' }}>{form.errors.employee_id}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="software_id">Software</label>
            <select
              id="software_id"
              name="software_id"
              value={form.values.software_id}
              onChange={form.handleChange}
              className="form-select"
              required
            >
              <option value="">Select software...</option>
              {software?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {form.errors.software_id && <p style={{ color: 'var(--color-danger-600)' }}>{form.errors.software_id}</p>}
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default LicensesPage;
