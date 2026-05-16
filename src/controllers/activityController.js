const Activity = require('../models/Activity');

// @desc    Get user activities with pagination
// @route   GET /api/activities
// @access  Private
exports.getActivities = async (req, res, next) => {
  try {
    const {
      toolName,
      page = 1,
      limit = 20,
      sort = '-timestamp',
    } = req.query;

    // Build query
    const query = { userId: req.user._id };
    
    if (toolName) {
      query.toolName = toolName;
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch activities
    const activities = await Activity.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Count total
    const total = await Activity.countDocuments(query);

    res.status(200).json({
      success: true,
      count: activities.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      activities,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new activity
// @route   POST /api/activities
// @access  Private
exports.createActivity = async (req, res, next) => {
  try {
    const { toolName, actionType, relatedId, metadata } = req.body;

    if (!toolName || !actionType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide toolName and actionType',
      });
    }

    const activity = await Activity.create({
      userId: req.user._id,
      toolName,
      actionType,
      relatedId,
      metadata,
    });

    res.status(201).json({
      success: true,
      activity,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private
exports.deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
    }

    // التحقق من أن المستخدم يملك هذا الـ Activity
    if (activity.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this activity',
      });
    }

    await activity.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Activity deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};