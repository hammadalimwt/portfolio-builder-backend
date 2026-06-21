const crypto = require('crypto');
const PasswordReset = require('../models/PasswordReset');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utilities/AppError');
const logger = require('./loggerService');
const emailService = require('./emailService');

class PasswordResetService {
  async generateResetToken(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('No account found with this email address.', 404);
    }

    // Generate random 6-character OTP code
    const token = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Expire in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save token
    await PasswordReset.create({
      userId: user._id,
      email,
      token,
      expiresAt
    });

    // Send password reset email via SMTP (or log fallback)
    await emailService.sendPasswordResetEmail(email, token);

    return { token, email };
  }

  async verifyResetToken(email, token) {
    const resetRequest = await PasswordReset.findOne({
      email,
      token,
      isUsed: false
    });

    if (!resetRequest) {
      throw new AppError('Invalid or expired reset code.', 400);
    }

    if (new Date() > resetRequest.expiresAt) {
      throw new AppError('Reset code has expired.', 400);
    }

    return resetRequest;
  }

  async resetPassword(email, token, newPassword) {
    const resetRequest = await this.verifyResetToken(email, token);

    const user = await userRepository.findById(resetRequest.userId);
    if (!user) {
      throw new AppError('User no longer exists.', 404);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Mark reset request as used
    resetRequest.isUsed = true;
    await resetRequest.save();

    // Clean up all password reset records for this user
    await PasswordReset.deleteMany({ userId: user._id });

    logger.info(`Password successfully reset for user email: ${email}`);
    return user;
  }
}

module.exports = new PasswordResetService();
