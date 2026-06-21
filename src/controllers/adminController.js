const adminService = require('../services/adminService');
const templateService = require('../services/templateService');
const systemConfigService = require('../services/systemConfigService');
const { getPaginationOptions, formatPaginationResult } = require('../utilities/paginationHelper');
const { sendSuccess } = require('../utilities/responseHelper');
const { userResponseDTO } = require('../dtos/auth.dto');
const { templateDetailDTO } = require('../dtos/template.dto');
const asyncHandler = require('../utilities/asyncHandler');

// User Management
const listUsers = asyncHandler(async (req, res) => {
  const { skip, limit, page, sort } = getPaginationOptions(req.query);

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  const users = await adminService.getAllUsers(filter, skip, limit, sort);
  const total = await adminService.getUsersCount(filter);

  const formatted = users.map(u => userResponseDTO(u));
  const result = formatPaginationResult(total, page, limit, formatted);

  return sendSuccess(res, 'Users retrieved successfully.', result);
});

const getUserDetails = asyncHandler(async (req, res) => {
  const user = await adminService.getUserDetails(req.params.id);
  return sendSuccess(res, 'User details retrieved successfully.', { user: userResponseDTO(user) });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const user = await adminService.updateUserStatus(req.params.id, status);
  return sendSuccess(res, `User status updated to ${status} successfully.`, { user: userResponseDTO(user) });
});

const deleteUser = asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.params.id);
  return sendSuccess(res, 'User deleted successfully.');
});

// Template Management
const createTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.createTemplate(req.body, req.user.id);
  return sendSuccess(res, 'Template created successfully.', { template: templateDetailDTO(template) }, 201);
});

const updateTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.updateTemplate(req.params.id, req.body);
  return sendSuccess(res, 'Template updated successfully.', { template: templateDetailDTO(template) });
});

const deleteTemplate = asyncHandler(async (req, res) => {
  await templateService.deleteTemplate(req.params.id);
  return sendSuccess(res, 'Template deleted successfully.');
});

// Category Management
const createCategory = asyncHandler(async (req, res) => {
  const category = await templateService.createCategory(req.body);
  return sendSuccess(res, 'Category created successfully.', { category }, 201);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await templateService.updateCategory(req.params.id, req.body);
  return sendSuccess(res, 'Category updated successfully.', { category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await templateService.deleteCategory(req.params.id);
  return sendSuccess(res, 'Category deleted successfully.');
});

// Placeholder Management
const addPlaceholder = asyncHandler(async (req, res) => {
  const template = await templateService.addPlaceholder(req.params.id, req.body);
  return sendSuccess(res, 'Placeholder added successfully.', { template: templateDetailDTO(template) });
});

const updatePlaceholders = asyncHandler(async (req, res) => {
  const template = await templateService.updatePlaceholders(req.params.id, req.body.placeholders);
  return sendSuccess(res, 'Placeholders updated successfully.', { template: templateDetailDTO(template) });
});

// Dashboard Analytics
const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  return sendSuccess(res, 'Dashboard stats retrieved successfully.', { stats });
});

// System Config
const getSystemConfig = asyncHandler(async (req, res) => {
  const config = await systemConfigService.getConfig();
  return sendSuccess(res, 'System configurations retrieved successfully.', { config });
});

const updateSystemConfig = asyncHandler(async (req, res) => {
  const config = await systemConfigService.updateConfig(req.body);
  return sendSuccess(res, 'System configurations updated successfully.', { config });
});

module.exports = {
  listUsers,
  getUserDetails,
  updateUserStatus,
  deleteUser,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createCategory,
  updateCategory,
  deleteCategory,
  addPlaceholder,
  updatePlaceholders,
  getDashboardStats,
  getSystemConfig,
  updateSystemConfig
};
