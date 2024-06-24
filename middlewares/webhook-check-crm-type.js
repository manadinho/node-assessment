const CrmConfigs = require("../models/crm-config");
const { Op, literal } = require("sequelize");

/**
 * Middleware for processing requests related to the CRM platform.
 * @param {Object} _req - The request object.
 * @param {Object} _res - The response object.
 * @param {Function} _next - The next function in the middleware chain.
 *
 * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
 */
module.exports = async (_req, _res, _next) => {
  try {
    const platform = getPlatform(_req);

    if (platform === "PIPEDRIVE") {
      const crm_config = await CrmConfigs.findOne({
        where: {
          config: {
            ["user_id"]: _req.query.userid,
          },
        },
      });
      if (!crm_config) {
        _next(new Error("CRM configuration not found"));
        return;
      }

      if (!crm_config.isActive) {
        _res.redirect("/crm-not-active");
        return;
      }

      _req.crm_type = crm_config.name;
      _req.crm_ref_type = crm_config.ref_type;
      _req.crm_ref_id = crm_config.ref_id;
      _req.crm_config = crm_config.config;

      _next();
      return;
    }

    if (platform === "SALESFORCE") {
      const crm_config = await CrmConfigs.findOne({
        where: {
          config: {
            ["salesforce_userid"]: _req.query.userid,
          },
        },
      });

      if (!crm_config) {
        _next(new Error("CRM configuration not found"));
        return;
      }

      if (!crm_config.isActive) {
        _res.redirect("/crm-not-active");
        return;
      }

      _req.crm_type = crm_config.name;
      _req.crm_ref_type = crm_config.ref_type;
      _req.crm_ref_id = crm_config.ref_id;
      _req.crm_config = crm_config.config;

      _next();
      return;
    }

    if (platform === "HUBSPOT") {
      const crm_config = await CrmConfigs.findOne({
        where: {
          config: {
            ["portalId"]: _req.body.portalId,
          },
        },
      });
      if (!crm_config) {
        _next(new Error("CRM configuration not found"));
        return;
      }

      if (!crm_config.isActive) {
        _next(new Error("Hubspot CRM is not active"));
        return;
      }

      _req.crm_type = crm_config.name;
      _req.crm_ref_type = crm_config.ref_type;
      _req.crm_ref_id = crm_config.ref_id;
      _req.crm_config = crm_config.config;

      _next();
      return;
    }

    _next(new Error(`${platform} this plarform is not implemented`));
  } catch (error) {
    _next(error);
  }
};

/**
 * Get the platform from the request object.
 *
 * This function extracts the platform from the request body or query parameters.
 *
 * @param {Object} _req - The request object containing body and query properties.
 * @returns {string|null} The platform if found, or null if not provided.
 * @throws {Error} Throws an error if the platform is not provided.
 *
 * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
 */
const getPlatform = (_req) => {
  const plarform = _req.body.platform || _req.query.platform || null;

  if (!plarform) {
    throw new Error("Platform is not provided");
  }

  return plarform;
};
