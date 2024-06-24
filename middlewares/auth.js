const axios = require("axios");

const public_routes = [
  "login",
  "register",
  "forget-password",
  "/hubspot",
  "/hubspot/callback",
  "/salesforce",
  "/salesforce/callback",
];

/**
 * Middleware function to perform to check token is valid or not before handling a request.
 *
 * @param {Object} _req - The Express request object.
 * @param {Object} _res - The Express response object.
 * @param {Function} _next - The next middleware function in the chain.
 *
 * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
 */
module.exports = (_req, _res, _next) => {
  try {
    const url = _req.originalUrl.split("?")[0];

    if (!public_routes.includes(url)) {
      const token = getToken(_req);
      const account_id = getAccountId(_req);
      const user_id = getUserId(_req);

      const url = `${process.env.API_BASE_URL}accounts/${account_id}/lists/null/entries`;

      const headers = {
        "X-Auth-Token": token,
      };

      axios
        .get(url, { headers })
        .then((res) => {
          if (res.data.status) {
            _req.user = {
              id: user_id,
              name: "Dummy User",
              email: "dumy@email.com",
            };
            _next();
          }
        })
        .catch((error) => {
          if (error.response) {
            _next(new Error(error.response.data.message));
          }
        });
    } else {
      _next();
    }
  } catch (error) {
    _next(error);
  }
};

/**
 * Get the authentication token from the request.
 *
 * @param {object} _req - The request object.
 * @returns {string} The authentication token.
 * @throws {Error} If the token is not found.
 *
 * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
 */
const getToken = (_req) => {
  const token =
    _req.body.token || _req.query.token || _req.headers["x-access-token"];

  if (!token) {
    throw new Error("Token is required");
  }

  return token;
};

/**
 * Get the account ID from the request object.
 *
 * This function extracts the account ID from the request object's body, query parameters,
 * or headers and returns it. If no account ID is found, it throws an error.
 *
 * @param {object} _req - The request object.
 * @returns {string} The account ID.
 * @throws {Error} Throws an error if the account ID is not found.
 *
 * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
 */
const getAccountId = (_req) => {
  const account_id =
    _req.body.account_id ||
    _req.query.account_id ||
    _req.headers["x-account-id"];

  if (!account_id) {
    throw new Error("Account id is required");
  }

  return account_id;
};

const getUserId = (_req) => {
  const account_id =
    _req.body.user_id || _req.query.user_id || _req.headers["x-user-id"];

  if (!account_id) {
    throw new Error("User id is required");
  }

  return account_id;
};
