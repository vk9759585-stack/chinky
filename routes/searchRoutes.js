const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/searchController");

// ====================================
// SEARCH
// ====================================

router.get(
    "/",
    auth,
    controller.search
);

module.exports = router;