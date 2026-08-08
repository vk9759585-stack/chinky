const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const controller = require("../controllers/profileController");

// ====================================
// PROFILE
// ====================================

router.get("/", auth, controller.getProfile);

router.put("/", auth, controller.updateProfile);

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

// ====================================
// DELETE ACCOUNT
// ====================================

router.delete(
    "/",
    auth,
    controller.deleteAccount
);

module.exports = router;
