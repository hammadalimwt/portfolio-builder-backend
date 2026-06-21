const authService = require('../services/authService');
const passwordResetService = require('../services/passwordResetService');
const tokenService = require('../services/tokenService');
const { sendSuccess } = require('../utilities/responseHelper');
const { loginResponseDTO, userResponseDTO } = require('../dtos/auth.dto');
const asyncHandler = require('../utilities/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await authService.register(name, email, password);
  return sendSuccess(res, 'User registered successfully. Please verify your email.', { user: userResponseDTO(user) }, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return sendSuccess(res, 'Logged in successfully.', loginResponseDTO(result.user, result.accessToken, result.refreshToken));
});

const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, 'User profile retrieved.', { user: userResponseDTO(req.user) });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
  if (refreshToken) {
    await tokenService.revokeRefreshToken(refreshToken);
  }
  return sendSuccess(res, 'Logged out successfully.');
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: tokenVal } = req.body;
  if (!tokenVal) {
    return res.status(400).json({ success: false, message: 'Refresh token is required.' });
  }

  const dbToken = await tokenService.verifyRefreshToken(tokenVal);
  
  // Rotate refresh token: revoke current, issue new pair
  await tokenService.revokeRefreshToken(tokenVal);
  
  const newAccessToken = tokenService.generateAccessToken(dbToken.userId);
  const newRefreshToken = await tokenService.generateRefreshToken(dbToken.userId);

  return sendSuccess(res, 'Tokens refreshed successfully.', {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.query.token || req.body.token;
  const user = await authService.verifyEmail(token);
  return sendSuccess(res, 'Email verified successfully.', { user: userResponseDTO(user) });
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.resendVerificationEmail(email);
  return sendSuccess(res, 'Verification email resent successfully.');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await passwordResetService.generateResetToken(email);
  return sendSuccess(res, 'A password reset code has been sent.');
});

const verifyResetCode = asyncHandler(async (req, res) => {
  const { email, token } = req.body;
  await passwordResetService.verifyResetToken(email, token.toUpperCase());
  return sendSuccess(res, 'Verification code is correct.');
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword } = req.body;
  await passwordResetService.resetPassword(email, token, newPassword);
  return sendSuccess(res, 'Password has been successfully reset. Please login.');
});

module.exports = {
  register,
  login,
  getMe,
  logout,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  verifyResetCode,
  resetPassword
};
