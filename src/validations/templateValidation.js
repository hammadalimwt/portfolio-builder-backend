const Joi = require('joi');

const placeholderSchema = Joi.object({
  name: Joi.string().required(),
  variable: Joi.string().required().regex(/^[a-zA-Z0-9_]+$/),
  type: Joi.string().valid('text', 'textarea', 'array_string', 'array_object').default('text')
});

const createTemplateSchema = Joi.object({
  name: Joi.string().trim().required().max(100),
  category: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/), // Mongoose ObjectId regex
  description: Joi.string().required(),
  thumbnail: Joi.string().trim().allow(''),
  htmlCode: Joi.string().required(),
  cssCode: Joi.string().required(),
  javascriptCode: Joi.string().allow(''),
  placeholders: Joi.array().items(placeholderSchema).default([]),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE')
});

const updateTemplateSchema = Joi.object({
  name: Joi.string().trim().max(100),
  category: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  description: Joi.string(),
  thumbnail: Joi.string().trim().allow(''),
  htmlCode: Joi.string(),
  cssCode: Joi.string(),
  javascriptCode: Joi.string().allow(''),
  placeholders: Joi.array().items(placeholderSchema),
  status: Joi.string().valid('ACTIVE', 'INACTIVE')
});

const addPlaceholderSchema = placeholderSchema;

const createCategorySchema = Joi.object({
  name: Joi.string().trim().required().max(50),
  description: Joi.string().trim().allow(''),
  isActive: Joi.boolean().default(true)
});

module.exports = {
  createTemplateSchema,
  updateTemplateSchema,
  addPlaceholderSchema,
  createCategorySchema
};
