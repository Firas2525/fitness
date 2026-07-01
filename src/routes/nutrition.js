const router = require('express').Router();
const ctrl   = require('../controllers/nutritionController');
const auth   = require('../middleware/auth');

router.use(auth);

router.post('/log',      ctrl.logMeal);
router.get('/suggest',   ctrl.suggest);
router.get('/today',     ctrl.getToday);
router.get('/history',   ctrl.getHistory);

module.exports = router;