const router = require("express").Router();
const crmConfigController = require("../controllers/crm-config-controller");
const crmConfigValidation = require("../middlewares/crm-config-validation");

router.get("/", (_req, _res) => {
  crmConfigController.index(_req, _res);
});

router.post("/create", crmConfigValidation, (_req, _res) => {
  crmConfigController.create(_req, _res);
});

router.post('/status-update', (_req, _res) => {
  crmConfigController.statusUpdate(_req, _res);
});

module.exports = router;
