const express = require('express');
const router = express.Router();
const {
  getActivities,
  createActivity,
  deleteActivity,
} = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

// كل الـ routes محمية (تحتاج authentication)
router.use(protect);

router.route('/')
  .get(getActivities)
  .post(createActivity);

router.route('/:id')
  .delete(deleteActivity);

module.exports = router;