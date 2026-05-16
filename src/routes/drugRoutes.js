const express = require('express');
const router = express.Router();
const { checkDrugs } = require('../controllers/drugController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/check', checkDrugs);

module.exports = router;