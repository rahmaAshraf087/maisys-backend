const { checkDrugInteractions } = require('../services/groqService');
const Activity = require('../models/Activity');

// @desc    Check drug interactions
// @route   POST /api/drugs/check
// @access  Private
exports.checkDrugs = async (req, res, next) => {
  try {
    const { medications, language } = req.body; // ✅ أضيفنا language

    if (!medications || !Array.isArray(medications) || medications.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 medications',
      });
    }

    if (medications.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 medications allowed',
      });
    }

    const result = await checkDrugInteractions(
      medications,
      language || 'en' // ✅ بنبعت اللغة
    );

    await Activity.create({
      userId: req.user._id,
      toolName: 'drug_interaction',
      actionType: 'created',
      metadata: { medications, language },
    });

    res.status(200).json({
      success: true,
      medications,
      interactions: result.interactions,
      summary: result.summary,
      warnings: result.warnings,
    });
  } catch (error) {
    next(error);
  }
};