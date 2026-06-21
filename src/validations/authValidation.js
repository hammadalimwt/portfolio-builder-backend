const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().required().min(2).max(50),
  email: Joi.string().trim().email().required(),
  password: Joi.string().required().min(6)
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  token: Joi.string().required(),
  newPassword: Joi.string().required().min(6)
});

const verifyResetCodeSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  token: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().required().min(6)
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyResetCodeSchema,
  changePasswordSchema
};
