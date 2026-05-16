const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  signup,
  login,
  getMe,
  updateProfile,
  logout,
  forgotPassword,
  verifyOTP,
  resetPassword,
  uploadProfilePicture,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ✅ Multer
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/profile/picture', protect, upload.single('picture'), uploadProfilePicture); // ✅
router.post('/logout', protect, logout);

module.exports = router;