const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://rahma:YOUR_PASSWORD@maisys-db.may4ses.mongodb.net/maisys_db?appName=maisys-db';

const connectDatabase = async () => {
  try {
    console.log('🔵 Connecting to MongoDB...');
    console.log('🔵 URI starts with:', MONGODB_URI.substring(0, 30));
    
    const conn = await mongoose.connect(MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📁 Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDatabase;
