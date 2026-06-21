const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  position: { type: String, required: true },
  startDate: { type: String },
  endDate: { type: String }, // Can be "Present"
  description: { type: String }
});

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  year: { type: String },
  description: { type: String }
});

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, default: '' },            // Cloudinary secure_url
  imagePublicId: { type: String, default: '', select: false }, // Cloudinary public_id (hidden)
  description: { type: String },
  technologies: [{ type: String }],
  githubLink: { type: String, default: '' },
  liveDemo: { type: String, default: '' }
});

const certificateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  organization: { type: String, required: true },
  date: { type: String },
  verificationLink: { type: String, default: '' }
});

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Portfolio title is required'],
      trim: true
    },
    portfolioType: {
      type: String,
      enum: ['Developer', 'Designer', 'Student', 'Freelancer', 'Business'],
      required: [true, 'Portfolio type is required'],
      index: true
    },
    personal: {
      fullName: { type: String, required: true },
      title: { type: String, default: '' },
      profileImage: { type: String, default: '' },           // Cloudinary secure_url
      profileImagePublicId: { type: String, default: '', select: false }, // Cloudinary public_id (hidden)
      bio: { type: String, default: '' },
      location: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      website: { type: String, default: '' }
    },
    socialLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' }
    },
    skills: [{ type: String }],
    experience: [experienceSchema],
    education: [educationSchema],
    projects: [projectSchema],
    certificates: [certificateSchema],
    additionalInfo: {
      achievements: [{ type: String }],
      languages: [{ type: String }],
      interests: [{ type: String }],
      hobbies: [{ type: String }]
    },
    status: {
      type: String,
      enum: ['DRAFT', 'COMPLETED', 'DOWNLOADED'],
      default: 'DRAFT',
      index: true
    },
    zipPath: {
      type: String,
      default: ''
    },
    generatedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
module.exports = Portfolio;
