const hubspotService = require("../services/hubspot-services");
const pipedriveService = require("../services/pipedrive-service");
const salesforceService = require("../services/salesforce-services");
const crm_services = {
  HUBSPOT: hubspotService,
  SALESFORCE: salesforceService,
  PIPEDRIVE: pipedriveService,
};

module.exports = {
  /**
   * Search for a contact in the CRM system.
   *
   * @param {object} _req - The request object containing parameters.
   * @param {string} _req.crm_type - The type of CRM system to use.
   * @param {string} _req.params.contact_number - The contact number to search for.
   * @param {object} _res - The response object to send the result.
   * @throws {Error} Throws an error if the customer number is not provided.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async searchContact(_req, _res) {
    try {
      if (!_req.params.contact_number) {
        throw new Error("Customer number not provided");
      }

      const { data, message, success } = await crm_services[
        _req.crm_type
      ].searchContact(_req);

      _res.cutomResponse(data, message, success);
    } catch (error) {
      // TODO:: USE ANY LOGGER TO LOG OR SENTRY

      _res.cutomResponse({}, error.message, false);
    }
  },

  /**
   * Creates a new note using CRM services based on the provided CRM type.
   *
   * @param {Object} _req - The request object containing necessary data.
   * @param {string} _req.crm_type - The type of CRM system to use.
   * @param {Object} _res - The response object to send the result.
   * @throws {Error} - If something goes wrong during the note creation process.
   *
   * @author Muhammd Imran Israr <mimranisrar6@gmail.com>
   */
  async createNote(_req, _res) {
    const result = await crm_services[_req.crm_type].createNote(_req);
    if (result) {
      _res.cutomResponse(result, "Notes created");
      return;
    }

    _res.cutomResponse({}, "Something went wrong", false);
  },

  async outBoundCall(_req, _res) {
    await crm_services[_req.crm_type].outBoundCall(_req);

    if (["SALESFORCE", "PIPEDRIVE",].includes(_req.crm_type)) {
      _res.redirect("/call-initiated");

      return;
    }

    _res.cutomResponse({ body: _req.body });
  },
};
