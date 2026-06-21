const AppError = require('../utilities/AppError');
const logger = require('../services/loggerService');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: true
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, '')
      }));
      logger.error(`Validation failed for ${req.originalUrl}: ${JSON.stringify(details)}`);
      return next(new AppError('Validation failed', 400, details));
    }

    // Replace request payload with sanitized, cast values
    req[property] = value;
    next();
  };
};

module.exports = validate;
