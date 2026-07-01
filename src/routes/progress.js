const router = require('express').Router();
const ctrl   = require('../controllers/progressController');
const auth   = require('../middleware/auth');

router.use(auth);

router.get('/weight',   ctrl.getWeight);
router.get('/calories', ctrl.getCalories);
router.get('/steps',    ctrl.getSteps);
router.get('/summary',  ctrl.getSummary);

module.exports = router;