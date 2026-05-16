const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware للتحقق من JWT Token
exports.protect = async (req, res, next) => {
  let token;

  // التحقق من وجود Token في الـ Headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // استخراج الـ Token
      token = req.headers.authorization.split(' ')[1];

      // التحقق من صحة الـ Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // جلب بيانات المستخدم من الـ Database (بدون الـ password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      next(); // المتابعة للـ Controller
    } catch (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
    });
  }
};

// Middleware اختياري: التحقق من الـ Role (Admin, User, etc.)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};