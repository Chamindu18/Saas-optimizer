/**
 * Software Model
 * 
 * Represents a SaaS tool used by the company.
 * 
 * Fields:
 * - id: Unique identifier
 * - name: Software name (e.g., Slack, Zoom, Adobe)
 * - category: Category (e.g., Dev, Design, Marketing)
 * - price_per_seat: Cost per license (monthly or yearly)
 */

// For now, we're using mock data stored in memory
// When connected to a real database, this will query PostgreSQL

let softwares = [
  {
    id: 1,
    name: 'Slack',
    category: 'Communication',
    price_per_seat: 8.0,
  },
  {
    id: 2,
    name: 'Zoom',
    category: 'Communication',
    price_per_seat: 16.99,
  },
  {
    id: 3,
    name: 'Adobe Creative Suite',
    category: 'Design',
    price_per_seat: 54.99,
  },
  {
    id: 4,
    name: 'GitHub Enterprise',
    category: 'Development',
    price_per_seat: 21.0,
  },
];

/**
 * Get all software
 */
const getAllSoftware = () => {
  return softwares;
};

/**
 * Get software by ID
 */
const getSoftwareById = (id) => {
  return softwares.find(software => software.id === id);
};

/**
 * Create new software
 */
const createSoftware = (softwareData) => {
  const newSoftware = {
    id: softwares.length > 0 ? Math.max(...softwares.map(s => s.id)) + 1 : 1,
    name: softwareData.name,
    category: softwareData.category,
    price_per_seat: softwareData.price_per_seat,
  };
  softwares.push(newSoftware);
  return newSoftware;
};

/**
 * Update software
 */
const updateSoftware = (id, softwareData) => {
  const softwareIndex = softwares.findIndex(software => software.id === id);
  if (softwareIndex === -1) return null;

  softwares[softwareIndex] = {
    ...softwares[softwareIndex],
    ...softwareData,
    id: softwares[softwareIndex].id, // Prevent ID from being changed
  };

  return softwares[softwareIndex];
};

/**
 * Delete software
 */
const deleteSoftware = (id) => {
  const softwareIndex = softwares.findIndex(software => software.id === id);
  if (softwareIndex === -1) return null;

  const deletedSoftware = softwares[softwareIndex];
  softwares.splice(softwareIndex, 1);
  return deletedSoftware;
};

export default {
  getAllSoftware,
  getSoftwareById,
  createSoftware,
  updateSoftware,
  deleteSoftware,
};
