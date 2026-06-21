const express = require('express');
const templateController = require('../controllers/templateController');

const router = express.Router();

router.get('/', templateController.getTemplates);
router.get('/categories', templateController.getCategories);
router.get('/popular', templateController.getPopularTemplates);
router.get('/:id/preview', templateController.previewTemplate);
router.get('/:id', templateController.getTemplateById);

module.exports = router;
