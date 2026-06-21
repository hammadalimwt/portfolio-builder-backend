const Joi = require('joi');

const experienceSchema = Joi.object({
  company: Joi.string().required(),
  position: Joi.string().required(),
  startDate: Joi.string().allow(''),
  endDate: Joi.string().allow(''),
  description: Joi.string().allow('')
});

const educationSchema = Joi.object({
  institution: Joi.string().required(),
  degree: Joi.string().required(),
  year: Joi.string().allow(''),
  description: Joi.string().allow('')
});

const projectSchema = Joi.object({
  name: Joi.string().required(),
  image: Joi.string().allow(''),
  description: Joi.string().allow(''),
  technologies: Joi.array().items(Joi.string()).default([]),
  githubLink: Joi.string().allow(''),
  liveDemo: Joi.string().allow('')
});

const certificateSchema = Joi.object({
  name: Joi.string().required(),
  organization: Joi.string().required(),
  date: Joi.string().allow(''),
  verificationLink: Joi.string().allow('')
});

const personalSchema = Joi.object({
  fullName: Joi.string().required(),
  title: Joi.string().allow(''),
  profileImage: Joi.string().allow(''),
  bio: Joi.string().allow(''),
  location: Joi.string().allow(''),
  email: Joi.string().email().allow(''),
  phone: Joi.string().allow(''),
  website: Joi.string().allow('')
});

const socialLinksSchema = Joi.object({
  github: Joi.string().allow(''),
  linkedin: Joi.string().allow(''),
  twitter: Joi.string().allow(''),
  instagram: Joi.string().allow(''),
  facebook: Joi.string().allow('')
});

const additionalInfoSchema = Joi.object({
  achievements: Joi.array().items(Joi.string()).default([]),
  languages: Joi.array().items(Joi.string()).default([]),
  interests: Joi.array().items(Joi.string()).default([]),
  hobbies: Joi.array().items(Joi.string()).default([])
});

const createPortfolioSchema = Joi.object({
  templateId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/).messages({
    'string.pattern.base': 'templateId must be a valid MongoDB ObjectId',
    'any.required':         'templateId is required — please select a template',
    'string.empty':         'templateId is required — please select a template',
  }),
  title:         Joi.string().required().max(100).messages({
    'any.required': 'Portfolio title is required',
    'string.empty': 'Portfolio title cannot be empty',
  }),
  portfolioType: Joi.string()
    .valid('Developer', 'Designer', 'Student', 'Freelancer', 'Business')
    .required(),
  personal:       personalSchema.required(),
  socialLinks:    socialLinksSchema.default({}),
  skills:         Joi.array().items(Joi.string()).default([]),
  experience:     Joi.array().items(experienceSchema).default([]),
  education:      Joi.array().items(educationSchema).default([]),
  projects:       Joi.array().items(projectSchema).default([]),
  certificates:   Joi.array().items(certificateSchema).default([]),
  additionalInfo: additionalInfoSchema.default({}),
  status:         Joi.string().valid('DRAFT', 'COMPLETED', 'DOWNLOADED').default('DRAFT'),
});

const updatePortfolioSchema = Joi.object({
  templateId:    Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  title:         Joi.string().max(100),
  portfolioType: Joi.string().valid('Developer', 'Designer', 'Student', 'Freelancer', 'Business'),
  personal:      personalSchema,
  socialLinks:   socialLinksSchema,
  skills:        Joi.array().items(Joi.string()),
  experience:    Joi.array().items(experienceSchema),
  education:     Joi.array().items(educationSchema),
  projects:      Joi.array().items(projectSchema),
  certificates:  Joi.array().items(certificateSchema),
  additionalInfo: additionalInfoSchema,
  status:        Joi.string().valid('DRAFT', 'COMPLETED', 'DOWNLOADED'),
});

module.exports = {
  createPortfolioSchema,
  updatePortfolioSchema
};
