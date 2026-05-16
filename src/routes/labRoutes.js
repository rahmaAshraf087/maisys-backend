const express = require('express');
const router = express.Router();
const { analyzeLab } = require('../controllers/labController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/analyze', analyzeLab);

module.exports = router;