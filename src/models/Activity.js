const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  toolName: {
    type: String,
    required: true,
    enum: ['chat', 'symptom_checker', 'drug_interaction', 'lab_test', 'research_assistant'],
  },
  actionType: {
    type: String,
    required: true,
    enum: ['created', 'updated', 'deleted', 'viewed'],
  },
  relatedId: {
    type: String, // ID of Chat, SymptomCheck, etc.
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // أي بيانات إضافية
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index للبحث السريع
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ toolName: 1 });

module.exports = mongoose.model('Activity', activitySchema);