const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/isAdmin");

const controller = require("../controllers/adminController");

router.get('/monetization/overview', auth, isAdmin, controller.getMonetizationOverview);
router.get('/monetization/ledger', auth, isAdmin, controller.getWalletLedger);

router.get('/monetization/upi-requests', auth, isAdmin, controller.getUpiCoinRequests);
router.post('/monetization/upi-requests/:id/review', auth, isAdmin, controller.reviewUpiCoinRequest);
router.get('/monetization/withdrawals', auth, isAdmin, controller.getWithdrawalRequests);
router.post('/monetization/withdrawals/:id/review', auth, isAdmin, controller.reviewWithdrawalRequest);

router.get('/withdrawals', auth, isAdmin, controller.getWithdrawals);
router.put('/withdrawals/:id/status', auth, isAdmin, controller.updateWithdrawalStatus);

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
