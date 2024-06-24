const CrmConfigs = require("../models/crm-config");
const { Op } = require("sequelize");

module.exports = {
  /**
   * Retrieve CRM configurations for a specific reference ID.
   *
   * @param {Request} _req - Express request object.
   * @param {Response} _res - Express response object.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async index(_req, _res) {
    try {
      const ref_id = this.getRefId(_req);

      const crmConfigs = await CrmConfigs.findAll({
        where: { ref_id },
      });

      _res.cutomResponse(crmConfigs, "All configurations");
    } catch (error) {
      // TODO:: USE ANY LOGGER TO LOG OR SENTRY
      _res.cutomResponse({}, error.message, false);
    }
  },

  /**
   * Checks if a CRM configuration exists for another user.
   * @param {Object} _req - The request object.
   * @returns {Array} - An array containing a message and a boolean indicating if the configuration exists for another user.
   */
  async checkIfCrmConfigExistsForOtherUser(_req) {
    const ref_id = this.getRefId(_req);

    if (_req.body.name === "HUBSPOT") {
      const crm_exist = await CrmConfigs.findOne({
        where: {
          name: "HUBSPOT",
          config: {
            ["portalId"]: _req.body.config.portalId,
          },
          ref_id: {
            [Op.ne]: ref_id,
          },
        },
      });

      if (crm_exist) {
        return ["Hubspot configuration already exists for another user", true];
      }
    }

    if (_req.body.name === "SALESFORCE") {
      const crm_exist = await CrmConfigs.findOne({
        where: {
          name: "SALESFORCE",
          config: {
            ["salesforce_userid"]: _req.body.config.salesforce_userid,
          },
          ref_id: {
            [Op.ne]: ref_id,
          },
        },
      });

      if (crm_exist) {
        return [
          "Salesforce configuration already exists for another user",
          true,
        ];
      }
    }

    if (_req.body.name === "PIPEDRIVE") {
      const crm_exist = await CrmConfigs.findOne({
        where: {
          name: "PIPEDRIVE",
          config: {
            ["api_token"]: _req.body.config.api_token,
            ["user_id"]: _req.body.config.user_id,
          },
          ref_id: {
            [Op.ne]: ref_id,
          },
        },
      });

      if (crm_exist) {
        return [
          "Pipedrive configuration already exists for another user",
          true,
        ];
      }
    }

    return ["", false];
  },

  /**
   * This async function handles the creation or update of CRM configurations.
   * @param {object} _req - The request object.
   * @param {object} _res - The response object.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async create(_req, _res = null) {
    try {
      const ref_id = this.getRefId(_req);

      const [_message, _isCrmConfigExists] =
        await this.checkIfCrmConfigExistsForOtherUser(_req);

      if (_isCrmConfigExists) {
        if (_res) {
          _res.cutomResponse({}, _message, false);
          return;
        }

        throw new Error(_message);
      }

      const isCrmConfigExists = await CrmConfigs.findOne({
        where: { ref_id, name: _req.body.name },
      });

      let result = null;
      let message = "";

      if (isCrmConfigExists) {
        await this.updateCRMConfig(_req);

        message = `CRM configuration updated`;
      } else {
        result = await this.createCRMConfig(_req);

        message = `CRM configuration created`;
      }

      // make all crm configurations as inactive
      await this.makeCRMConfigInActive(_req);

      // make current CRM as active
      await this.makeCurrentCRMConfigActive(_req);

      if (_res) {
        _res.cutomResponse(result, message);
      } else {
        return result;
      }
    } catch (error) {
      // TODO:: USE ANY LOGGER TO LOG OR SENTRY

      if (_res) {
        _res.cutomResponse({}, error.message, false);
      } else {
        throw new Error(error.message);
      }
    }
  },

  /**
   * Create a CRM configuration.
   *
   * @param {Object} _req - The request object.
   * @returns {Promise<Object>} A Promise that resolves to the created CRM configuration.
   * @throws {Error} If an error occurs during the creation process.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async createCRMConfig(_req) {
    try {
      const ref_id = this.getRefId(_req);

      const data = { ..._req.body, ref_type: "extension", ref_id };

      result = await CrmConfigs.create(data);
      return result;
    } catch (error) {
      throw new Error(error);
    }
  },

  /**
   * Updates the CRM configuration with the provided data.
   * @param {object} _req - The request object containing the data.
   * @returns {Promise<object>} The updated CRM configuration.
   * @throws {Error} If an error occurs during the update.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async updateCRMConfig(_req) {
    try {
      const ref_id = this.getRefId(_req);

      const data = { ..._req.body, ref_type: "extension", ref_id };

      const updateCondition = {
        where: { ref_id, name: _req.body.name },
      };

      result = await CrmConfigs.update(data, { ...updateCondition });

      return result;
    } catch (error) {
      throw new Error(error);
    }
  },

  /**
   * Makes a CRM configuration inactive.
   *
   * @param {Object} _req - The request object.
   * @returns {Promise<Object>} - A promise that resolves to the result of the operation.
   * @throws {Error} - Throws an error if there's an issue.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async makeCRMConfigInActive(_req) {
    try {
      const ref_id = this.getRefId(_req);

      const data = {
        isActive: false,
      };

      const updateCondition = {
        where: { ref_id },
      };

      result = await CrmConfigs.update(data, { ...updateCondition });

      return result;
    } catch (error) {
      throw new Error(error);
    }
  },

  /**
   * Makes the current CRM configuration active.
   *
   * @param {Object} _req - The request object.
   * @returns {Promise<Object>} - A Promise that resolves to the result.
   * @throws {Error} - If an error occurs during the process.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async makeCurrentCRMConfigActive(_req) {
    try {
      const ref_id = this.getRefId(_req);

      const data = {
        isActive: true,
      };

      const updateCondition = {
        where: { ref_id, name: _req.body.name },
      };

      result = await CrmConfigs.update(data, { ...updateCondition });

      return result;
    } catch (error) {
      throw new Error(error);
    }
  },

  /**
   * Get the user ID from the request object.
   * Priority order: request body, query parameters, and headers.
   *
   * @param {Object} _req - The request object.
   * @returns {string|undefined} The user ID or undefined if not found.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  getRefId(_req) {
    return _req.body.user_id || _req.query.user_id || _req.headers["x-user-id"];
  },

  /**
   * Asynchronously updates the status of a CRM configuration.
   *
   * This function first checks if the specified CRM configuration exists.
   * If it does, it sets all CRM configurations to inactive and then toggles
   * the active status of the specified configuration. It updates the CRM
   * configuration in the database and retrieves the updated list of configurations.
   * In case of errors, it responds with an error message.
   *
   * @param {_req} Object - The request object containing parameters and body.
   * @param {_res} Object - The response object used to send back the result or error.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async statusUpdate(_req, _res) {
    try {
      const ref_id = this.getRefId(_req);

      const isCrmConfigExists = await CrmConfigs.findOne({
        where: { ref_id, id: _req.body.id },
      });

      if (!isCrmConfigExists) {
        throw new Error("CRM configuration not found");
      }

      // make all crm configurations as inactive
      await this.makeCRMConfigInActive(_req);

      const isActive = !isCrmConfigExists.isActive;

      const data = {
        isActive,
      };

      const updateCondition = {
        where: { ref_id, id: _req.body.id },
      };

      await CrmConfigs.update(data, { ...updateCondition });

      const crmConfigs = await CrmConfigs.findAll({
        where: { ref_id },
      });

      _res.cutomResponse(crmConfigs, "All configurations");
    } catch (error) {
      _res.cutomResponse({}, error.message, false);
    }
  },
};
