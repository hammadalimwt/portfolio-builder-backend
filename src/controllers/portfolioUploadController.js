const portfolioService = require('../services/portfolioService');
const portfolioRepository = require('../repositories/portfolioRepository');
const { uploadToCloudinary, deleteFromCloudinary, configureCloudinary } = require('../config/cloudinaryConfig');
const { sendSuccess } = require('../utilities/responseHelper');
const { portfolioDetailDTO } = require('../dtos/portfolio.dto');
const AppError = require('../utilities/AppError');
const asyncHandler = require('../utilities/asyncHandler');

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/portfolios/:id/upload/profile-image
// Upload the personal.profileImage for a portfolio
// ─────────────────────────────────────────────────────────────────────────────
const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Please upload an image file.', 400);
  }

  const isConfigured = configureCloudinary();
  if (!isConfigured) {
    throw new AppError('Image upload service is not configured. Please set Cloudinary credentials.', 503);
  }

  // Verify portfolio ownership
  const portfolio = await portfolioService.getPortfolioById(req.params.id, req.user.id);

  // Delete old profile image if it was previously uploaded to Cloudinary
  if (portfolio.personal?.profileImagePublicId) {
    await deleteFromCloudinary(portfolio.personal.profileImagePublicId).catch(() => {});
  }

  // Upload to Cloudinary
  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'portfolio-maker/profile-images',
    transformation: [
      { width: 600, height: 600, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });

  // Patch portfolio personal sub-document
  const updated = await portfolioRepository.update(req.params.id, req.user.id, {
    'personal.profileImage': result.secure_url,
    'personal.profileImagePublicId': result.public_id
  });

  return sendSuccess(res, 'Profile image uploaded successfully.', {
    profileImage: result.secure_url,
    portfolio: portfolioDetailDTO(updated)
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/portfolios/:id/upload/project/:projectId
// Upload a screenshot for a specific project within a portfolio
// ─────────────────────────────────────────────────────────────────────────────
const uploadProjectImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Please upload an image file.', 400);
  }

  const isConfigured = configureCloudinary();
  if (!isConfigured) {
    throw new AppError('Image upload service is not configured. Please set Cloudinary credentials.', 503);
  }

  const portfolio = await portfolioService.getPortfolioById(req.params.id, req.user.id);

  // Find the target project inside the portfolio
  const projectIndex = portfolio.projects.findIndex(
    (p) => p._id.toString() === req.params.projectId
  );

  if (projectIndex === -1) {
    throw new AppError('Project not found inside this portfolio.', 404);
  }

  const project = portfolio.projects[projectIndex];

  // Delete old project image from Cloudinary if present
  if (project.imagePublicId) {
    await deleteFromCloudinary(project.imagePublicId).catch(() => {});
  }

  // Upload new image
  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'portfolio-maker/project-images',
    transformation: [
      { width: 1200, height: 800, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });

  // Update the specific project's image fields
  portfolio.projects[projectIndex].image = result.secure_url;
  portfolio.projects[projectIndex].imagePublicId = result.public_id;
  await portfolio.save();

  return sendSuccess(res, 'Project image uploaded successfully.', {
    projectImage: result.secure_url,
    project: {
      id: project._id,
      name: project.name,
      image: result.secure_url
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/admin/templates/:id/thumbnail
// Upload a thumbnail for a template (admin only)
// ─────────────────────────────────────────────────────────────────────────────
const uploadTemplateThumbnail = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Please upload an image file.', 400);
  }

  const isConfigured = configureCloudinary();
  if (!isConfigured) {
    throw new AppError('Image upload service is not configured. Please set Cloudinary credentials.', 503);
  }

  const Template = require('../models/Template');
  const template = await Template.findById(req.params.id);
  if (!template) {
    throw new AppError('Template not found.', 404);
  }

  // Delete old thumbnail from Cloudinary
  if (template.thumbnailPublicId) {
    await deleteFromCloudinary(template.thumbnailPublicId).catch(() => {});
  }

  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'portfolio-maker/template-thumbnails',
    transformation: [
      { width: 800, height: 600, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });

  template.thumbnail = result.secure_url;
  template.thumbnailPublicId = result.public_id;
  await template.save();

  return sendSuccess(res, 'Template thumbnail uploaded successfully.', {
    thumbnail: result.secure_url
  });
});

module.exports = {
  uploadProfileImage,
  uploadProjectImage,
  uploadTemplateThumbnail
};
