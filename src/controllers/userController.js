const userRepository = require('../repositories/userRepository');
const { uploadToCloudinary, deleteFromCloudinary, configureCloudinary } = require('../config/cloudinaryConfig');
const { sendSuccess } = require('../utilities/responseHelper');
const { userResponseDTO } = require('../dtos/auth.dto');
const AppError = require('../utilities/AppError');
const asyncHandler = require('../utilities/asyncHandler');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/users/profile
// ─────────────────────────────────────────────────────────────────────────────
const getProfile = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user.id);
  return sendSuccess(res, 'User profile retrieved successfully.', {
    user: userResponseDTO(user)
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/users/profile
// ─────────────────────────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio } = req.body;
  const user = await userRepository.update(req.user.id, { name, bio });
  return sendSuccess(res, 'Profile updated successfully.', {
    user: userResponseDTO(user)
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/users/avatar
// Accepts: multipart/form-data  field name: "avatar"
// ─────────────────────────────────────────────────────────────────────────────
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Please upload an image file.', 400);
  }

  // Ensure Cloudinary is configured
  const isConfigured = configureCloudinary();
  if (!isConfigured) {
    throw new AppError(
      'Image upload service is not configured. Please set Cloudinary credentials.',
      503
    );
  }

  // Fetch existing user to potentially remove the old avatar from Cloudinary
  const existingUser = await userRepository.findByIdWithAvatarId(req.user.id);

  // Delete old avatar from Cloudinary if it exists
  if (existingUser.avatarPublicId) {
    await deleteFromCloudinary(existingUser.avatarPublicId).catch(() => {
      // Non-fatal — log is handled inside deleteFromCloudinary
    });
  }

  // Upload new avatar buffer to Cloudinary
  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'portfolio-builder/avatars',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' }, // Smart face-crop
      { quality: 'auto', fetch_format: 'auto' }                    // Auto format + compression
    ]
  });

  // Persist Cloudinary URL and public_id
  const user = await userRepository.update(req.user.id, {
    avatar: result.secure_url,
    avatarPublicId: result.public_id
  });

  return sendSuccess(res, 'Avatar uploaded successfully.', {
    avatar: result.secure_url,
    user: userResponseDTO(user)
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/users/change-password
// ─────────────────────────────────────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // Fetch user with password field (select: false by default)
  const user = await userRepository.findByEmail(req.user.email, true);

  if (!(await user.comparePassword(oldPassword))) {
    throw new AppError('Incorrect current password.', 401);
  }

  user.password = newPassword;
  await user.save();

  return sendSuccess(res, 'Password changed successfully. Please log in again with your new password.');
});

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword
};
