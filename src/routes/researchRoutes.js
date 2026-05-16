const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getResearchChats,
  getResearchChat,
  createResearchChat,
  uploadPaperFile,    // ✅ جديد
  addMessage,
  deleteResearchChat,
  summarizePaper,
  generateQA,
  translatePaper,
  chatAboutPaper,
  getOcrText,         // ✅ جديد
} = require('../controllers/researchController');
const { protect } = require('../middleware/authMiddleware');

// ✅ Multer للـ file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  },
});

router.use(protect);

router.route('/')
  .get(getResearchChats)
  .post(createResearchChat);

router.route('/:id')
  .get(getResearchChat)
  .delete(deleteResearchChat);

router.post('/:id/upload', upload.single('file'), uploadPaperFile); // ✅ جديد
router.post('/:id/messages', addMessage);
router.post('/:id/summarize', summarizePaper);
router.post('/:id/qa', generateQA);
router.post('/:id/translate', translatePaper);
router.post('/:id/chat', chatAboutPaper);
router.get('/:id/ocr', getOcrText);  // ✅ جديد

module.exports = router;