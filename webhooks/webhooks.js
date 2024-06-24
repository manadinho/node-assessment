const router = require("express").Router();
const contactController = require("../controllers/contact-controller");
const limiter = require("../middlewares/limiter");
const webhookAuth = require("../middlewares/webhook-auth");
const webhookCheckCrmType = require("../middlewares/webhook-check-crm-type");

router.post(
  "/outbound-call",
  webhookAuth,
  webhookCheckCrmType,
  (_req, _res) => {
    contactController.outBoundCall(_req, _res);
  }
);

// THIS ROUTE IS FOR SALESFORCE & PIPEDRIVE ONLY FOR POC
// AUTHENTICATION IS NOT IMPLEMENTED
// RATE LIMITING IS IMPLEMENTED
router.get("/outbound-call", limiter, webhookCheckCrmType, (_req, _res) => {
  contactController.outBoundCall(_req, _res);
});

module.exports = router;
