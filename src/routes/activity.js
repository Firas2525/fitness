const router = require('express').Router();
const ctrl   = require('../controllers/activityController');
const auth   = require('../middleware/auth');

// all activity routes require token
router.use(auth);

router.post('/',     ctrl.log);
router.get('/',      ctrl.getAll);
router.get('/today', ctrl.getToday);

module.exports = router;