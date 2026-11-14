import * as employees from '../models/Employee.js';
import respondError from '../utils/respondError.js';

const validId = (value) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
const validFields = ({ name, email }) => typeof name === 'string' && name.trim().length > 0 &&
  name.trim().length <= 120 && typeof email === 'string' && email.length <= 255 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const invalid = (res) => res.status(400).json({ success: false, error: 'Valid name and email are required' });

export const list = async (_req, res) => {
  try { res.json({ success: true, data: await employees.listEmployees() }); }
  catch (error) { respondError(res, error); }
};

export const get = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid employee ID' });
  try {
    const employee = await employees.getEmployee(Number(req.params.id));
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
    return res.json({ success: true, data: employee });
  } catch (error) { return respondError(res, error); }
};

export const create = async (req, res) => {
  if (!validFields(req.body)) return invalid(res);
  try {
    const employee = await employees.createEmployee({ name: req.body.name.trim(), email: req.body.email.trim() });
    return res.status(201).json({ success: true, data: employee });
  } catch (error) { return respondError(res, error); }
};

export const update = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid employee ID' });
  if (!validFields(req.body)) return invalid(res);
  try {
    const employee = await employees.updateEmployee(Number(req.params.id),
      { name: req.body.name.trim(), email: req.body.email.trim() });
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
    return res.json({ success: true, data: employee });
  } catch (error) { return respondError(res, error); }
};

export const remove = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid employee ID' });
  try {
    const id = Number(req.params.id);
    const employee = await employees.deleteEmployee(id);
    if (employee) return res.json({ success: true, data: employee });
    if (await employees.getEmployee(id)) {
      return res.status(409).json({ success: false, error: 'Remove employee licenses before deleting this employee' });
    }
    return res.status(404).json({ success: false, error: 'Employee not found' });
  } catch (error) {
    if (error.code === '23503') return res.status(409).json({ success: false, error: 'Employee has licenses' });
    return respondError(res, error);
  }
};
