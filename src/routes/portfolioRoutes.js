const express = require('express');
const portfolioController = require('../controllers/portfolioController');
const portfolioUploadController = require('../controllers/portfolioUploadController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { createPortfolioSchema, updatePortfolioSchema } = require('../validations/portfolioValidation');

const router = express.Router();

router.use(protect);

router.post('/', validate(createPortfolioSchema), portfolioController.createPortfolio);
router.get('/', portfolioController.listPortfolios);
router.get('/:id', portfolioController.getPortfolio);
router.put('/:id', validate(updatePortfolioSchema), portfolioController.updatePortfolio);
router.delete('/:id', portfolioController.deletePortfolio);
router.post('/:id/duplicate', portfolioController.duplicatePortfolio);

// Status workflow endpoints
router.put('/:id/draft', validate(updatePortfolioSchema), portfolioController.saveDraft);
router.put('/:id/complete', portfolioController.completePortfolio);

// ── Cloudinary Image Uploads ────────────────────────────────────────────────
// Upload portfolio personal profile image
router.put(
  '/:id/upload/profile-image',
  upload.single('profileImage'),
  portfolioUploadController.uploadProfileImage
);

// Upload a project screenshot inside a portfolio
router.put(
  '/:id/upload/project/:projectId',
  upload.single('projectImage'),
  portfolioUploadController.uploadProjectImage
);

module.exports = router;
