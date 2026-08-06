const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/isAdmin");

const controller = require("../controllers/adminController");

// ===================================
// USERS
// ===================================

router.get(
    "/users",
    auth,
    isAdmin,
    controller.getUsers
);

// ===================================
// POSTS
// ===================================

router.get(
    "/posts",
    auth,
    isAdmin,
    controller.getFlows
);

// ===================================
// REPORTS
// ===================================

router.get(
    "/reports",
    auth,
    isAdmin,
    controller.getReports
);

// ===================================
// VERIFY USER
// ===================================

router.put(
    "/verify/:id",
    auth,
    isAdmin,
    controller.verifyUser
);

// ===================================
// BAN USER
// ===================================

router.put(
    "/ban/:id",
    auth,
    isAdmin,
    controller.banUser
);

// ===================================
// UNBAN USER
// ===================================

router.put(
    "/unban/:id",
    auth,
    isAdmin,
    controller.unbanUser
);

module.exports = router;
