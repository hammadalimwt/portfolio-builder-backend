const jwt = require('jsonwebtoken');
const AppError = require('../utilities/AppError');
const userRepository = require('../repositories/userRepository');
const asyncHandler = require('../utilities/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }

  // Check if user still exists
  const user = await userRepository.findById(decoded.id);
  if (!user) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // Check if user is blocked
  if (user.status === 'BLOCKED') {
    return next(new AppError('Your account has been blocked. Please contact admin.', 403));
  }

  // Grant access
  req.user = user;
  next();
});

module.exports = { protect };
