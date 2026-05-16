const mongoose = require('mongoose');

const researchChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paperTitle: {
    type: String,
    required: true,
    trim: true,
  },
  authors: [String],
  journal: { type: String, trim: true },

  // ✅ النص المستخرج من الـ PDF أو الصورة
  extractedText: { type: String, default: '' },

  summary: {
    background: String,
    methods: String,
    keyFindings: String,
    conclusions: String,
  },

  qaPairs: [
    {
      question: String,
      answer: String,
    },
  ],

  translation: {
    targetLanguage: String,
    translatedText: String,
  },

  messages: [
    {
      role: { type: String, enum: ['user', 'assistant'] },
      content: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('ResearchChat', researchChatSchema);