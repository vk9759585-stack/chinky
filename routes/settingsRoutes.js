const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/settingsController');
router.get('/metadata', auth, controller.getSettingsMetadata);
module.exports = router;
