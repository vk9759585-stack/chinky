const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const controller = require("../controllers/profileController");

// ====================================
// PROFILE
// ====================================

router.get("/", auth, controller.getProfile);

router.put("/", auth, controller.updateProfile);

router.get("/privacy", auth, controller.getPrivacySettings);
router.put("/privacy", auth, controller.updatePrivacySettings);

// ====================================
// USER CONTENT
// ====================================

router.get(
    "/content",
    auth,
    controller.getMyContent
);

router.get(
    "/saved-posts",
    auth,
    controller.getSavedPosts
);

router.get("/user/:id", auth, controller.getPublicProfile);

// ====================================
// PROFILE PHOTO
// ====================================

router.post(
    "/upload",
    auth,
    upload.single("profile"),
    controller.uploadProfilePhoto
);

// ====================================
// VERIFICATION REQUEST
// ====================================

router.post(
    "/verification-request",
    auth,
    controller.requestVerification
);

router.post("/business-verification-request", auth, controller.requestBusinessVerification);

router.post("/deactivate", auth, controller.deactivateAccount);

router.post("/data-export-requests", auth, controller.createDataExportRequest);
router.get("/data-export-requests", auth, controller.listDataExportRequests);
router.get("/data-export-requests/:id/download", auth, controller.downloadDataExport);

// ====================================
// DELETE ACCOUNT
// ====================================

router.delete(
    "/",
    auth,
    controller.deleteAccount
);

module.exports = router;
