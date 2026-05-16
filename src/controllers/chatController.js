const Chat = require('../models/Chat');
const Activity = require('../models/Activity');
const { getMedicalChatResponse, analyzeFileWithAI } = require('../services/groqService');

// @desc    Get user chats with pagination
// @route   GET /api/chats
// @access  Private
exports.getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ userId: req.user._id })
      .select('title messages createdAt updatedAt') // ✅ بنجيب messages
      .sort({ updatedAt: -1 });

    // ✅ بنبعت بس أول رسالة مع كل chat مش كل الرسائل
    const chatsWithPreview = chats.map(chat => ({
      _id: chat._id,
      title: chat.title,
      updatedAt: chat.updatedAt,
      createdAt: chat.createdAt,
      messages: chat.messages.slice(0, 3), // أول 3 رسائل بس للـ preview
    }));

    res.status(200).json({
      success: true,
      total: chats.length,
      chats: chatsWithPreview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single chat with all messages
// @route   GET /api/chats/:id
// @access  Private
exports.getChat = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // التحقق من الملكية
    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this chat',
      });
    }

    res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new chat
// @route   POST /api/chats
// @access  Private
exports.createChat = async (req, res, next) => {
  try {
    const { title } = req.body;
    const chat = await Chat.create({
      userId: req.user._id,
      title: title || 'New Chat',
      messages: [],
    });

    res.status(201).json({ success: true, chat });
  } catch (error) {
    next(error);
  }
  try {
    const { title, aiProvider, model } = req.body;

    const chat = await Chat.create({
      userId: req.user._id,
      title: title || 'New Chat',
      aiProvider: aiProvider || 'groq',
      model: model || 'llama-3.3-70b',
      messages: [],
    });

    // Log activity
    await Activity.create({
      userId: req.user._id,
      toolName: 'chat',
      actionType: 'created',
      relatedId: chat._id.toString(),
    });

    res.status(201).json({
      success: true,
      chat,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add message to chat
// @route   POST /api/chats/:id/messages
// @access  Private
exports.addMessage = async (req, res, next) => {
  try {
    const { role, content, fileBase64, fileType, fileName } = req.body;

    if (!role || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide role and content',
      });
    }

    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // إضافة رسالة المستخدم
    const userMessage = {
      role,
      content,
      metadata: fileBase64 ? { hasFile: true, fileType, fileName } : {},
    };
    chat.messages.push(userMessage);

    let aiResponse = null;

    if (role === 'user') {
      console.log('🤖 Getting AI response...');

      const messagesForAI = chat.messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // لو في file — نستخدم analyzeFileWithAI
      if (fileBase64 && fileType) {
        aiResponse = await analyzeFileWithAI(
          messagesForAI,
          fileBase64,
          fileType,
          content
        );
      } else {
        aiResponse = await getMedicalChatResponse(messagesForAI);
      }

      chat.messages.push({
        role: 'assistant',
        content: aiResponse,
        metadata: { model: 'llama-3.3-70b-versatile', provider: 'groq' },
      });
    }

    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Message added successfully',
      aiResponse,
      chat,
    });
  } catch (error) {
    console.error('🔴 Add message error:', error.message);
    next(error);
  }
};

// @desc    Update chat (rename, archive)
// @route   PUT /api/chats/:id
// @access  Private
exports.updateChat = async (req, res, next) => {
  try {
    const { title, isArchived } = req.body;

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // التحقق من الملكية
    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this chat',
      });
    }

    if (title !== undefined) chat.title = title;
    if (isArchived !== undefined) chat.isArchived = isArchived;

    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Chat updated successfully',
      chat,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete chat
// @route   DELETE /api/chats/:id
// @access  Private
exports.deleteChat = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }

    // التحقق من الملكية
    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this chat',
      });
    }

    await chat.deleteOne();

    // Log activity
    await Activity.create({
      userId: req.user._id,
      toolName: 'chat',
      actionType: 'deleted',
      relatedId: req.params.id,
    });

    res.status(200).json({
      success: true,
      message: 'Chat deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};


exports.renameChat = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    chat.title = title.trim();
    await chat.save();

    res.status(200).json({ success: true, chat });
  } catch (error) {
    next(error);
  }
};