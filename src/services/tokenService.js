const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');
const AppError = require('../utilities/AppError');

class TokenService {
  generateAccessToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m'
    });
  }

  async generateRefreshToken(userId) {
    const token = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d'
    });

    // Parse expiry for Date object (default 7 days)
    let expiryDays = 7;
    const match = (process.env.JWT_REFRESH_EXPIRY || '').match(/^(\d+)d$/);
    if (match) {
      expiryDays = parseInt(match[1], 10);
    }
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Save refresh token to database
    await RefreshToken.create({
      userId,
      token,
      expiresAt
    });

    return token;
  }

  async verifyRefreshToken(token) {
    // 1. Verify JWT signature
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new AppError('Invalid or expired refresh token. Please login again.', 401);
    }

    // 2. Check in database
    const dbToken = await RefreshToken.findOne({ token, isRevoked: false });
    if (!dbToken) {
      throw new AppError('Refresh token has been revoked or does not exist.', 401);
    }

    // Check expiry
    if (new Date() > dbToken.expiresAt) {
      await dbToken.deleteOne();
      throw new AppError('Refresh token expired. Please login again.', 401);
    }

    return dbToken;
  }

  async revokeRefreshToken(token) {
    await RefreshToken.findOneAndUpdate({ token }, { isRevoked: true });
  }

  async revokeAllUserRefreshTokens(userId) {
    await RefreshToken.updateMany({ userId }, { isRevoked: true });
  }
}

module.exports = new TokenService();
