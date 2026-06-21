const express = require('express');
const downloadController = require('../controllers/downloadController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

// Frontend compatibility routes
router.post('/generate/:portfolioId', downloadController.generateZip);
router.get('/history', downloadController.getDownloadHistory);
router.delete('/history/:id', downloadController.deleteDownloadHistory);
router.get('/:portfolioId', downloadController.downloadZip);

// Original backend routes
router.post('/:portfolioId', downloadController.generateZip);
router.get('/download/:portfolioId', downloadController.downloadZip);
router.get('/', downloadController.getDownloadHistory);

module.exports = router;
