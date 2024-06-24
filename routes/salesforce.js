const router = require("express").Router();
const oauthController = require("../controllers/oauth-controller");

router.get("/", (_req, _res) => {
  return _res.redirect("/salesforce/connect");
});

router.get("/connect", (_req, _res) => {
  oauthController.connect(_req, _res, "SALESFORCE");
});

router.get("/callback", (_req, _res) => {
  oauthController.callback(_req, _res, "SALESFORCE");
});

module.exports = router;
