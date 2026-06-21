const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const portfolioRoutes = require('./portfolioRoutes');
const templateRoutes = require('./templateRoutes');
const downloadRoutes = require('./downloadRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/portfolios', portfolioRoutes);
router.use('/templates', templateRoutes);
router.use('/generator', downloadRoutes);
router.use('/downloads', downloadRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
