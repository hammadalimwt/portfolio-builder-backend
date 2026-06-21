const mongoose = require('mongoose');

const placeholderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  variable: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'textarea', 'array_string', 'array_object'],
    default: 'text'
  }
});

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Template slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TemplateCategory',
    required: [true, 'Template category is required']
  },
  description: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: ''                      // Cloudinary secure_url
  },
  thumbnailPublicId: {
    type: String,
    default: '',
    select: false                    // Hidden from API responses
  },
  htmlCode: {
    type: String,
    required: true
  },
  cssCode: {
    type: String,
    required: true
  },
  javascriptCode: {
    type: String,
    default: ''
  },
  placeholders: [placeholderSchema],
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
    index: true
  },
  totalDownloads: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Template = mongoose.model('Template', templateSchema);
module.exports = Template;
