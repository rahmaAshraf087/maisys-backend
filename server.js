require('dotenv').config();
const app = require('./src/app');
const connectDatabase = require('./src/config/database');

// التحقق من المتغيرات البيئية المطلوبة
if (!process.env.MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI is not defined in .env file');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ Error: JWT_SECRET is not defined in .env file');
  process.exit(1);
}

// الـ Port
const PORT = process.env.PORT || 3000;

// دالة لتشغيل الـ Server
const startServer = async () => {
  try {
    // الاتصال بـ MongoDB
    await connectDatabase();
    
    // تشغيل الـ Server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('='.repeat(50));
      console.log('🚀 MAISYS Backend Server Started Successfully!');
      console.log('='.repeat(50));
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`📱 Mobile access: http://YOUR_IP:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📅 Started at: ${new Date().toLocaleString()}`);
      console.log('='.repeat(50));
      console.log('');
      console.log('Available endpoints:');
      console.log(`  GET  /health`);
      console.log(`  POST /api/auth/signup`);
      console.log(`  POST /api/auth/login`);
      console.log(`  GET  /api/auth/me`);
      console.log(`  GET  /api/chats`);
      console.log(`  GET  /api/activities`);
      console.log(`  GET  /api/research`);
      console.log('');
      console.log('Press Ctrl+C to stop the server');
      console.log('='.repeat(50));
    });

    // معالجة الإغلاق المفاجئ
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down server gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Rejection:', err.message);
      server.close(() => process.exit(1));
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// تشغيل الـ Server
startServer();
