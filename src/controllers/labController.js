const { analyzeLabResults } = require('../services/groqService');
const Activity = require('../models/Activity');

// @desc    Analyze lab test results
// @route   POST /api/lab/analyze
// @access  Private
exports.analyzeLab = async (req, res, next) => {
  try {
    const { labText, imageBase64, language } = req.body; // ✅ أضيفنا language

    let textToAnalyze = labText;
    if (!textToAnalyze && imageBase64) {
      textToAnalyze = 'Lab results image provided - analyze common blood test patterns and explain what normal ranges are';
    }
    if (!textToAnalyze) {
      return res.status(400).json({ success: false, message: 'Please provide lab text or image' });
    }

    const analysis = await analyzeLabResults(
      textToAnalyze,
      language || 'en' // ✅ بنبعت اللغة
    );

    await Activity.create({
      userId: req.user._id,
      toolName: 'lab_test',
      actionType: 'created',
      metadata: { language },
    });

    res.status(200).json({
      success: true,
      extractedText: textToAnalyze,
      analysis,
    });
  } catch (error) {
    next(error);
  }
};