/**
 * LICENSES PAGE
 * License assignment and management
 */

import React, { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { useForm } from '../hooks/useForm';
import { licenseAPI, employeeAPI, softwareAPI, apiErrorMessage } from '../services/api';
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
  const [showIdle, setShowIdle] = useState(false);
  const [error, setError] = useState(null);

  const { data: licenses, isLoading, error: fetchError, execute: refetch } = useAsync(
    () => licenseAPI.getAllLicenses(),
    true
  );

  const { data: employees, error: employeesError, isLoading: employeesLoading } = useAsync(() => employeeAPI.getAll(), true);
  const { data: software, error: softwareError, isLoading: softwareLoading } = useAsync(() => softwareAPI.getAllSoftware(), true);
  const { data: idleLicenses, error: idleError, isLoading: idleLoading, execute: refetchIdle } = useAsync(licenseAPI.getIdleLicenses, showIdle);

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
        await refetch();
        if (showIdle) await refetchIdle();
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    },
    validate
  );

  const handlePrune = async (id) => {
    if (window.confirm('Prune this license? The assignment will remain in history.')) {
      try {
        await licenseAPI.pruneLicense(id);
        await refetch();
        if (showIdle) await refetchIdle();
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
  };

  const handleReactivate = async (id) => {
    const lastActiveDate = window.prompt('Enter the verified last activity timestamp (ISO 8601, within 30 days):');
    if (!lastActiveDate) return;
    try {
      await licenseAPI.reactivateLicense(id, lastActiveDate);
      await refetch();
      if (showIdle) await refetchIdle();
    } catch (err) { setError(apiErrorMessage(err)); }
  };

  if (isLoading) return <Spinner text="Loading licenses..." />;

  return (
    <div className="management-page">
      <div className="management-header">
        <h1>Licenses</h1>
        {isManager && <Button onClick={() => setShowModal(true)}>Assign License</Button>}
        <Button variant="secondary" onClick={() => setShowIdle(value => !value)}>{showIdle ? 'All Licenses' : 'Idle Licenses'}</Button>
      </div>

      {(error || fetchError || employeesError || softwareError || idleError) && <ErrorMessage message={error || apiErrorMessage(fetchError || employeesError || softwareError || idleError)} onDismiss={() => setError(null)} />}
      {showIdle && idleLoading && <Spinner text="Loading idle licenses..." />}

      <Card>
        <Table
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'employeeName', label: 'Employee' },
            { key: 'softwareName', label: 'Software' },
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
                row.status === 'pruned' ?
                  <Button variant="ghost" size="sm" onClick={() => handleReactivate(row.id)}>Reactivate</Button> :
                  <Button variant="ghost" size="sm" onClick={() => handlePrune(row.id)}>Prune</Button>
              ),
            }] : []),
          ]}
          data={(showIdle ? idleLicenses : licenses) || []}
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
            {(employeesLoading || softwareLoading) && <span>Loading options...</span>}
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="license-form" loading={form.isSubmitting} disabled={employeesLoading || softwareLoading || !employees?.length || !software?.length}>
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
