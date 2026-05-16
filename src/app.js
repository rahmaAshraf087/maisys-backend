const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const activityRoutes = require('./routes/activityRoutes');
const chatRoutes = require('./routes/chatRoutes');
const researchRoutes = require('./routes/researchRoutes');
const drugRoutes = require('./routes/drugRoutes');
const labRoutes = require('./routes/labRoutes');

const app = express();

// ===== MIDDLEWARE =====
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ===== ROUTES =====
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MAISYS Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/lab', labRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

app.use(errorHandler);

module.exports = app;