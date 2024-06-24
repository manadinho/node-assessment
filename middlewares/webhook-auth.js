const crypto = require("crypto-js");

/**
 * Authentication Middleware
 *
 * This middleware is used to authenticate incoming requests based on a custom signature.
 * It checks if the request URL is not in the list of public routes, and if so,
 * it verifies the request signature against the expected signature.
 *
 * @param {object} _req - The Express request object.
 * @param {object} _res - The Express response object.
 * @param {function} _next - The next middleware function.
 *
 * @throws {Error} If the request signature is missing or invalid.
 *
 * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
 */
module.exports = (_req, _res, _next) => {
  try {
    const received_signature = _req.headers["pxb-signature"];

    if (!received_signature) {
      throw new Error("Signature is missing");
    }

    const signature = createSignatuter(_req);

    if (signature !== received_signature) {
      throw new Error("Invalid signature");
    }

    _next();
  } catch (error) {
    _next(error);
  }
};

/**
 * Creates a signature based on the request data.
 *
 * @param {Object} _req - The request object.
 * @param {string} _req.method - The HTTP method of the request.
 * @param {string} _req.originalUrl - The original URL of the request (for GET requests).
 * @param {Object} _req.body - The body of the request (for POST requests).
 * @returns {string} The generated signature.
 *
 * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
 */
const createSignatuter = (_req) => {
  let data = null;

  const method = _req.method;

  if (method === "GET") {
    data = _req.originalUrl;
  }

  if (method === "POST") {
    data = JSON.stringify(_req.body);
  }

  return generateSignature(data);
};

/**
 * Generate a signature for the given data using a secret key.
 *
 * @param {string} data - The data to be signed.
 * @returns {string} The generated signature.
 *
 * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
 */
const generateSignature = (data) => {
  const secret_key = process.env.SECRET_KEY;

  return crypto.HmacSHA256(data, secret_key).toString(crypto.enc.Hex);
};
