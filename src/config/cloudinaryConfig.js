const cloudinary = require('cloudinary').v2;
const logger = require('../services/loggerService');

/**
 * Configure Cloudinary with environment credentials.
 * Called once on startup (or lazily on first upload request).
 */
const configureCloudinary = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    logger.warn(
      'Cloudinary credentials are missing. Image uploads will fail. ' +
      'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.'
    );
    return false;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key:    CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true        // Always use HTTPS URLs
  });

  return true;
};

/**
 * Upload a file buffer directly to Cloudinary using upload_stream.
 * This is the serverless-safe approach — no temp files are written to disk.
 *
 * @param {Buffer}  buffer    - File buffer from multer memoryStorage
 * @param {object}  options   - Cloudinary upload options (folder, transformation, etc.)
 * @returns {Promise<object>} - Cloudinary upload result containing secure_url, public_id, etc.
 */
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      resource_type: 'image',
      folder: 'portfolio-builder',
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      defaultOptions,
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload error: ${error.message}`);
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Delete a file from Cloudinary by public_id.
 *
 * @param {string} publicId - Cloudinary public_id of the asset to remove
 * @returns {Promise<object>}
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`Deleted Cloudinary asset: ${publicId} — result: ${result.result}`);
    return result;
  } catch (error) {
    logger.warn(`Failed to delete Cloudinary asset ${publicId}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  configureCloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};
