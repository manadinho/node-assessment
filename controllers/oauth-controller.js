const hubSpotService = require("../services/hubspot-services");
const salesforceService = require("../services/salesforce-services");
const crm_services = {
  HUBSPOT: hubSpotService,
  SALESFORCE: salesforceService,
};

module.exports = {
  connect(_req, _res, serviceName) {
    crm_services[serviceName].connect(_req, _res);
  },

  callback(_req, _res, serviceName) {
    crm_services[serviceName].callback(_req, _res);
  },
};
