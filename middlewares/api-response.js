/**
 * Middleware to set custom response headers and structure.
 * @param {object} _req - The request object.
 * @param {object} _res - The response object.
 * @param {function} _next - The next middleware function.
 *
 * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
 */
module.exports = (_req, _res, _next) => {
  _res.setHeader("Content-Type", "application/json");

  _res.cutomResponse = (
    data = {},
    message = "Operation completed",
    success = true
  ) => {
    _res.json({
      success,
      message,
      data,
    });
  };

  _next();
};
