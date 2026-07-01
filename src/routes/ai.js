const router = require('express').Router();
const ctrl   = require('../controllers/aiController');
const auth   = require('../middleware/auth');

router.use(auth);

router.post('/',       ctrl.ask);
router.get('/history', ctrl.getHistory);
router.delete('/history', ctrl.deleteHistory);

module.exports = router;