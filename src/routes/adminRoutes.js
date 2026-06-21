const express = require('express');
const adminController = require('../controllers/adminController');
const templateController = require('../controllers/templateController');
const portfolioUploadController = require('../controllers/portfolioUploadController');
const { protect } = require('../middlewares/authMiddleware');
const { restrictTo } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const {
  createTemplateSchema,
  updateTemplateSchema,
  createCategorySchema,
  addPlaceholderSchema
} = require('../validations/templateValidation');

const router = express.Router();

// Apply auth protection & role restriction for ALL admin routes
router.use(protect);
router.use(restrictTo('ADMIN'));

// User Management
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// Template Management
router.get('/templates', templateController.getTemplates);
router.post('/templates', validate(createTemplateSchema), adminController.createTemplate);
router.put('/templates/:id', validate(updateTemplateSchema), adminController.updateTemplate);
router.delete('/templates/:id', adminController.deleteTemplate);

// Template Thumbnail Upload (Cloudinary)
router.put(
  '/templates/:id/thumbnail',
  upload.single('thumbnail'),
  portfolioUploadController.uploadTemplateThumbnail
);

// Category Management
router.post('/categories', validate(createCategorySchema), adminController.createCategory);
router.put('/categories/:id', validate(createCategorySchema), adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Placeholder Management
router.post('/templates/:id/placeholders', validate(addPlaceholderSchema), adminController.addPlaceholder);
router.put('/templates/:id/placeholders', adminController.updatePlaceholders);

// Dashboard Analytics
router.get('/dashboard', adminController.getDashboardStats);
router.get('/stats', adminController.getDashboardStats);
router.get('/analytics', adminController.getDashboardStats);

// System Config
router.get('/config', adminController.getSystemConfig);
router.put('/config', adminController.updateSystemConfig);

module.exports = router;
