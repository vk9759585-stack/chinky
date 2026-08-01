const router = require("express").Router();

const auth = require("../middleware/authMiddleware");

const controller = require(
  "../controllers/adminController"
);

router.get(
  "/users",
  auth,
  controller.getUsers,
);

router.get(
  "/posts",
  auth,
  controller.getPosts,
);

router.get(
  "/reports",
  auth,
  controller.getReports,
);
router.put(
    "/verify/:id",
    auth,
    controller.verifyUser
);

router.put(
    "/ban/:id",
    auth,
    controller.banUser
);

router.put(
    "/unban/:id",
    auth,
    controller.unbanUser
);


module.exports = router;