const CrmConfigs = require("../models/crm-config");

/**
 * Middleware function to retrieve CRM configuration for a user and attach it to the request.
 *
 * @param {Request} _req - Express.js request object.
 * @param {Response} _res - Express.js response object.
 * @param {NextFunction} _next - Express.js next function.
 *
 * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
 */
module.exports = async (_req, _res, _next) => {
  try {
    const crm_config = await CrmConfigs.findOne({
      where: { ref_id: _req.user.id, isActive: true },
    });
    if (!crm_config) {
      _next(new Error("CRM configuration not found"));
      return;
    }

    _req.crm_type = crm_config.name;
    _req.crm_ref_type = crm_config.ref_type;
    _req.crm_ref_id = crm_config.ref_id;
    _req.crm_config = crm_config.config;

    _next();
  } catch (error) {
    _next(error);
  }
};
