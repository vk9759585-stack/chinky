const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const family = require('../controllers/familyPairingController');

router.get('/search', auth, family.searchTeen);
router.get('/status', auth, family.getStatus);
router.post('/link', auth, family.linkTeen);
router.post('/invite', auth, family.createInvite);
router.post('/join', auth, family.joinInvite);
router.put('/:id/controls', auth, family.updateControls);
router.delete('/:id', auth, family.unlink);

module.exports = router;
