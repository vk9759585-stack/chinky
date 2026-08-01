const router = require("express").Router();

const auth =
  require("../middleware/authMiddleware");

const controller =
  require("../controllers/securityController");

router.get(
  "/history",
  auth,
  controller.getLoginHistory,
);

module.exports = router;