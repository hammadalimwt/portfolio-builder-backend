const userRepository = require('../repositories/userRepository');
const tokenService = require('./tokenService');
const systemConfigService = require('./systemConfigService');
const AppError = require('../utilities/AppError');
const logger = require('./loggerService');
const crypto = require('crypto');
const emailService = require('./emailService');

class AuthService {
  async register(name, email, password) {
    // 1. Check system config if registrations are allowed
    const config = await systemConfigService.getConfig();
    if (config && !config.allowRegistrations) {
      throw new AppError('New registrations are currently disabled by the administrator.', 403);
    }

    // 2. Check if email exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email is already registered. Please login instead.', 400);
    }

    // 3. Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 4. Create user
    const user = await userRepository.create({
      name,
      email,
      password,
      role: 'USER', // Default role
      status: 'ACTIVE',
      emailVerified: false,
      verificationToken
    });

    // Send email verification link via SMTP (or log fallback)
    await emailService.sendEmailVerification(email, verificationToken);

    return user;
  }

  async login(email, password) {
    // 1. Find user (including password selection)
    const user = await userRepository.findByEmail(email, true);
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Incorrect email or password.', 401);
    }

    // 2. Check user status
    if (user.status === 'BLOCKED') {
      throw new AppError('Your account has been blocked. Please contact support.', 403);
    }

    // 3. Generate tokens
    const accessToken = tokenService.generateAccessToken(user._id);
    const refreshToken = await tokenService.generateRefreshToken(user._id);

    // 4. Update last login date
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in successfully: ${email}`);

    return { user, accessToken, refreshToken };
  }

  async verifyEmail(token) {
    // MongoDB check
    const users = await userRepository.findAll({ verificationToken: token });
    if (!users || users.length === 0) {
      throw new AppError('Invalid or expired email verification token.', 400);
    }

    const matchedUser = users[0];
    matchedUser.emailVerified = true;
    matchedUser.verificationToken = undefined;
    await matchedUser.save();

    logger.info(`Email verified successfully for user: ${matchedUser.email}`);
    return matchedUser;
  }

  async resendVerificationEmail(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('User not found with this email.', 404);
    }

    if (user.emailVerified) {
      throw new AppError('Email is already verified.', 400);
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    // Send email verification link via SMTP (or log fallback)
    await emailService.sendEmailVerification(email, verificationToken);
    return user;
  }
}

module.exports = new AuthService();
