const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middlewares/validateMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyResetCodeSchema
} = require('../validations/authValidation');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/signup', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/signin', validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-reset-code', validate(verifyResetCodeSchema), authController.verifyResetCode);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Verification routes
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Protected routes
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
