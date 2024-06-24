const router = require("express").Router();
const checkCrmTypeMiddleware = require("../middlewares/check-crm-type");
const contactController = require("../controllers/contact-controller");
const createNoteValidation = require("../middlewares/create-note-validation");

router.get("/:contact_number", checkCrmTypeMiddleware, (_req, _res) => {
  contactController.searchContact(_req, _res);
});

router.post(
  "/create-note",
  checkCrmTypeMiddleware,
  createNoteValidation,
  (_req, _res) => {
    contactController.createNote(_req, _res);
  }
);

module.exports = router;
