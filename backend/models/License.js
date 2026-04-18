/**
 * License Model
 * 
 * Represents a subscription assigned to a user.
 * 
 * Fields:
 * - id: Unique identifier
 * - user_id: ID of the user (Foreign Key)
 * - software_id: ID of the software (Foreign Key)
 * - assigned_date: When the license was assigned
 * - last_active_date: When the user last used the software
 * - status: 'active', 'idle', or 'pruned'
 */

// For now, we're using mock data stored in memory
// When connected to a real database, this will query PostgreSQL

let licenses = [
  {
    id: 1,
    user_id: 1,
    software_id: 1,
    assigned_date: new Date('2024-01-15'),
    last_active_date: new Date('2024-04-10'),
    status: 'active',
  },
  {
    id: 2,
    user_id: 1,
    software_id: 2,
    assigned_date: new Date('2024-01-15'),
    last_active_date: new Date('2024-02-20'),
    status: 'idle',
  },
  {
    id: 3,
    user_id: 2,
    software_id: 1,
    assigned_date: new Date('2024-02-01'),
    last_active_date: new Date('2024-04-15'),
    status: 'active',
  },
  {
    id: 4,
    user_id: 2,
    software_id: 3,
    assigned_date: new Date('2024-01-20'),
    last_active_date: new Date('2024-01-25'),
    status: 'pruned',
  },
];

/**
 * Get all licenses
 */
const getAllLicenses = () => {
  return licenses;
};

/**
 * Get license by ID
 */
const getLicenseById = (id) => {
  return licenses.find(license => license.id === id);
};

/**
 * Get licenses by user ID
 */
const getLicensesByUserId = (userId) => {
  return licenses.filter(license => license.user_id === userId);
};

/**
 * Get licenses by software ID
 */
const getLicensesBySoftwareId = (softwareId) => {
  return licenses.filter(license => license.software_id === softwareId);
};

/**
 * Create a new license
 */
const createLicense = (licenseData) => {
  const newLicense = {
    id: licenses.length > 0 ? Math.max(...licenses.map(l => l.id)) + 1 : 1,
    user_id: licenseData.user_id,
    software_id: licenseData.software_id,
    assigned_date: new Date(),
    last_active_date: new Date(),
    status: 'active',
  };
  licenses.push(newLicense);
  return newLicense;
};

/**
 * Update a license
 */
const updateLicense = (id, licenseData) => {
  const licenseIndex = licenses.findIndex(license => license.id === id);
  if (licenseIndex === -1) return null;

  licenses[licenseIndex] = {
    ...licenses[licenseIndex],
    ...licenseData,
    id: licenses[licenseIndex].id, // Prevent ID from being changed
  };

  return licenses[licenseIndex];
};

/**
 * Delete a license
 */
const deleteLicense = (id) => {
  const licenseIndex = licenses.findIndex(license => license.id === id);
  if (licenseIndex === -1) return null;

  const deletedLicense = licenses[licenseIndex];
  licenses.splice(licenseIndex, 1);
  return deletedLicense;
};

export default {
  getAllLicenses,
  getLicenseById,
  getLicensesByUserId,
  getLicensesBySoftwareId,
  createLicense,
  updateLicense,
  deleteLicense,
};
