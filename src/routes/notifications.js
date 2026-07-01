const router = require('express').Router();
const ctrl   = require('../controllers/notificationController');
const auth   = require('../middleware/auth');

router.use(auth);

router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);

module.exports = router;