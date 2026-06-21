const Joi = require('joi');

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  bio: Joi.string().trim().allow(''),
  avatar: Joi.string().trim().allow('')
});

module.exports = {
  updateProfileSchema
};
