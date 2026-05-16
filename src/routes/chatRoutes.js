const express = require('express');
const router = express.Router();
const {
  getChats,
  getChat,
  createChat,
  addMessage,
  updateChat,
  deleteChat,
  renameChat,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getChats)
  .post(createChat);

router.route('/:id')
  .get(getChat)
  .put(updateChat)
  .delete(deleteChat);

router.post('/:id/messages', addMessage);
router.put('/:id/rename', renameChat); // ✅ جديد

module.exports = router;