const multer = require('multer');
const AppError = require('../utilities/AppError');

// ─────────────────────────────────────────────────────────────────────────────
// Storage Strategy
// ─────────────────────────────────────────────────────────────────────────────
// We use Multer's memoryStorage so that file bytes are held in req.file.buffer.
// The controller then streams this buffer to Cloudinary via upload_stream.
// This is the ONLY approach that works on Vercel's read-only serverless filesystem.
// ─────────────────────────────────────────────────────────────────────────────

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed (jpeg, png, gif, webp, etc.)', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_UPLOAD_SIZE, 10) || 5 * 1024 * 1024 // 5 MB default
  }
});

module.exports = upload;
