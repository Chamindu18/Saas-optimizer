/**
 * Software Controller
 * 
 * Handles HTTP requests for software/tools.
 * Calls services for business logic.
 */

import softwareService from '../services/softwareService.js';

/**
 * GET /api/software
 * Get all software
 */
const getSoftware = async (req, res) => {
  try {
    const software = await softwareService.getAllSoftware();
    res.json({
      success: true,
      data: software,
      count: software.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/software/:id
 * Get a single software by ID
 */
const getSoftwareById = async (req, res) => {
  try {
    const { id } = req.params;
    const software = await softwareService.getSoftwareById(id);

    if (!software) {
      return res.status(404).json({
        success: false,
        error: 'Software not found',
      });
    }

    res.json({
      success: true,
      data: software,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/software
 * Create new software
 * 
 * Request body:
 * {
 *   "name": "Figma",
 *   "category": "Design",
 *   "price_per_seat": 12.0
 * }
 */
const createSoftware = async (req, res) => {
  try {
    const { name, category, price_per_seat } = req.body;

    const newSoftware = await softwareService.createSoftware({
      name,
      category,
      price_per_seat,
    });

    res.status(201).json({
      success: true,
      message: 'Software created successfully',
      data: newSoftware,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * PUT /api/software/:id
 * Update software
 * 
 * Request body (partial):
 * {
 *   "price_per_seat": 15.0
 * }
 */
const updateSoftware = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price_per_seat } = req.body;

    const updatedSoftware = await softwareService.updateSoftware(id, {
      name,
      category,
      price_per_seat,
    });

    res.json({
      success: true,
      message: 'Software updated successfully',
      data: updatedSoftware,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * DELETE /api/software/:id
 * Delete software
 */
const deleteSoftware = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSoftware = await softwareService.deleteSoftware(id);

    res.json({
      success: true,
      message: 'Software deleted successfully',
      data: deletedSoftware,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  getSoftware,
  getSoftwareById,
  createSoftware,
  updateSoftware,
  deleteSoftware,
};
