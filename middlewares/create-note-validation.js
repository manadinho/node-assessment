const Joi = require("joi");

const schema = Joi.object({
  contact_id: Joi.required(),
  content: Joi.string().required(),
});

/**
 * Middleware function to validate the request body against a given schema.
 *
 * @param {object} _req - The Express request object.
 * @param {object} _res - The Express response object.
 * @param {function} _next - The next middleware function to call.
 * @throws {Error} If the request body does not pass validation.
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
