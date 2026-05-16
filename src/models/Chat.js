const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    model: String,
    provider: String,
    citations: [String],
  },
});

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    default: 'New Chat',
  },
  messages: [messageSchema],
  
  // AI Configuration
  aiProvider: {
    type: String,
    enum: ['groq', 'cohere', 'mistral', 'gemini'],
    default: 'groq',
  },
  model: {
    type: String,
    default: 'llama-3.3-70b',
  },
  
  isArchived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index
chatSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);