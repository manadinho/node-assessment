const router = require("express").Router();
const hubspotAppController = require("../controllers/hubspot-app-controller");
const oauthController = require("../controllers/oauth-controller");

router.get("/", (_req, _res) => {
  hubspotAppController.index(_req, _res);
});

router.get("/connect", (_req, _res) => {
  oauthController.connect(_req, _res, "HUBSPOT");
});

router.get("/callback", (_req, _res) => {
  oauthController.callback(_req, _res, "HUBSPOT");
});

module.exports = router;
