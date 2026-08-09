const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/liveController');

router.post('/token', auth, controller.createZegoToken);
router.post('/start', auth, controller.startSession);
router.get('/active', auth, controller.activeSessions);
router.get('/user/:userId', auth, controller.activeForUser);
router.get('/session/:liveID', auth, controller.getSession);
router.post('/:liveID/end', auth, controller.endSession);
router.post('/:liveID/gifts', auth, controller.sendGift);

module.exports = router;
