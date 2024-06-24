const Joi = require("joi");

const schema = Joi.object({
  name: Joi.string().required(),
  config: Joi.object().required(),
});

/**
 * Middleware for validating the request body against a schema.
 *
 * @param {Request} _req - The Express request object.
 * @param {Response} _res - The Express response object.
 * @param {function} _next - The next middleware function to call.
 * @returns {void}
 * @throws {Error} If the request body validation fails, an error is thrown with details.
 *
 * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
 */
module.exports = (_req, _res, _next) => {
  const { error, value } = schema.validate(_req.body);

  if (error) {
    throw new Error(error.details[0].message);
  }

  _next();
};
