/**
 * Handle errors and send a JSON response with a 500 status code.
 * @param {Error} _err - The error object.
 * @param {Object} _req - The request object.
 * @param {Object} _res - The response object.
 * @param {Function} _next - The next function.
 *
 * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
 */
module.exports = (_err, _req, _res, _next) => {
  _res.status(500).json({
    success: false,
    message: _err.message,
    data: {},
  });
};
