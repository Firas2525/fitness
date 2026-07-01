const router = require("express").Router();
const ctrl = require("../controllers/exerciseController");
const auth = require("../middleware/auth");

router.get("/", ctrl.getAll);
router.get("/suggest", auth, ctrl.suggest);

module.exports = router;
