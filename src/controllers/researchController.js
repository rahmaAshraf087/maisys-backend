const ResearchChat = require('../models/ResearchChat');
const Activity = require('../models/Activity');
const {                                    // ✅ جديد
  summarizeResearchPaper,
  generateResearchQA,
  translateResearchPaper,
  getResearchChatResponse,
  extractTextFromImage,   // ✅
  extractTextFromPDF,
} = require('../services/groqService');

// @desc    Get research chats
// @route   GET /api/research
// @access  Private
exports.getResearchChats = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = '-updatedAt',
    } = req.query;

    const query = { userId: req.user._id };
    const skip = (page - 1) * limit;

    const chats = await ResearchChat.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ResearchChat.countDocuments(query);

    res.status(200).json({
      success: true,
      count: chats.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      chats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single research chat
// @route   GET /api/research/:id
// @access  Private
exports.getResearchChat = async (req, res, next) => {
  try {
    const chat = await ResearchChat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Research chat not found',
      });
    }

    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
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

// @desc    Create research chat
// @route   POST /api/research
// @access  Private
exports.createResearchChat = async (req, res, next) => {
  try {
    const { paperTitle, authors, journal } = req.body;

    if (!paperTitle) {
      return res.status(400).json({
        success: false,
        message: 'Please provide paper title',
      });
    }

    const chat = await ResearchChat.create({
      userId: req.user._id,
      paperTitle,
      authors: authors || [],
      journal,
      attachments: [],
      messages: [],
    });

    // Log activity
    await Activity.create({
      userId: req.user._id,
      toolName: 'research_assistant',
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

// @desc    Add attachment to research chat
// @route   POST /api/research/:id/attachments
// @access  Private
exports.addAttachment = async (req, res, next) => {
  try {
    const { fileName, fileType, fileUrl, fileSize } = req.body;

    const chat = await ResearchChat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Research chat not found',
      });
    }

    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    chat.attachments.push({
      fileName,
      fileType,
      fileUrl,
      fileSize,
    });

    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Attachment added successfully',
      chat,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add message to research chat
// @route   POST /api/research/:id/messages
// @access  Private
exports.addMessage = async (req, res, next) => {
  try {
    const { role, content } = req.body;

    if (!role || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide role and content',
      });
    }

    const chat = await ResearchChat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Research chat not found',
      });
    }

    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    chat.messages.push({ role, content });
    await chat.save();

    res.status(200).json({
      success: true,
      message: 'Message added successfully',
      chat,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete research chat
// @route   DELETE /api/research/:id
// @access  Private
exports.deleteResearchChat = async (req, res, next) => {
  try {
    const chat = await ResearchChat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Research chat not found',
      });
    }

    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    await chat.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Research chat deleted successfully',
    });
  } catch (error) {
    next(error);
  }



};

// @desc    Summarize research paper
// @route   POST /api/research/:id/summarize
// @access  Private
exports.summarizePaper = async (req, res, next) => {
  try {
    const { language } = req.body; // ✅ أضيفنا language
    const chat = await ResearchChat.findById(req.params.id);

    if (!chat) return res.status(404).json({ success: false, message: 'Not found' });
    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // ✅ نجيب الـ extractedText أو الـ messages
    const paperContext = chat.extractedText ||
      chat.messages.filter(m => m.role === 'user').map(m => m.content).join('\n') ||
      `Research paper: ${chat.paperTitle} by ${(chat.authors || []).join(', ')}`;

    console.log('🔵 Summarizing:', chat.paperTitle);

    const summary = await summarizeResearchPaper(
      paperContext,
      chat.paperTitle,
      language || 'en' // ✅
    );

    chat.summary = summary;
    await chat.save();

    res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error('🔴 Summarize error:', error.message);
    next(error);
  }
};


// @desc    Generate Q&A for research paper
// @route   POST /api/research/:id/qa
// @access  Private
exports.generateQA = async (req, res, next) => {
  try {
    const { language } = req.body; // ✅
    const chat = await ResearchChat.findById(req.params.id);

    if (!chat) return res.status(404).json({ success: false, message: 'Not found' });
    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const paperContext = chat.extractedText ||
      chat.messages.filter(m => m.role === 'user').map(m => m.content).join('\n') ||
      `Research paper: ${chat.paperTitle}`;

    console.log('🔵 Generating Q&A:', chat.paperTitle);

    const result = await generateResearchQA(
      paperContext,
      chat.paperTitle,
      language || 'en' // ✅
    );

    chat.qaPairs = result.qaPairs;
    await chat.save();

    res.status(200).json({ success: true, qaPairs: result.qaPairs });
  } catch (error) {
    console.error('🔴 Q&A error:', error.message);
    next(error);
  }
};


// @desc    Translate research paper
// @route   POST /api/research/:id/translate
// @access  Private
exports.translatePaper = async (req, res, next) => {
  try {
    const { targetLanguage } = req.body;

    if (!targetLanguage) {
      return res.status(400).json({ success: false, message: 'Please provide targetLanguage' });
    }

    const chat = await ResearchChat.findById(req.params.id);
    if (!chat) return res.status(404).json({ success: false, message: 'Not found' });
    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // ✅ نترجم الـ extractedText مش بس الـ title
    const paperContext = chat.extractedText ||
      chat.messages.filter(m => m.role === 'user').map(m => m.content).join('\n') ||
      `Research paper: ${chat.paperTitle} by ${(chat.authors || []).join(', ')}`;

    console.log('🔵 Translating to:', targetLanguage);

    const translatedText = await translateResearchPaper(paperContext, targetLanguage);

    chat.translation = { targetLanguage, translatedText };
    await chat.save();

    res.status(200).json({
      success: true,
      originalText: paperContext,
      translatedText,
      targetLanguage,
    });
  } catch (error) {
    console.error('🔴 Translate error:', error.message);
    next(error);
  }
};

// @desc    Chat about research paper with AI
// @route   POST /api/research/:id/chat
// @access  Private
exports.chatAboutPaper = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Please provide message content' });
    }

    const chat = await ResearchChat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Research chat not found' });
    }

    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // إضافة رسالة المستخدم
    chat.messages.push({ role: 'user', content });

    // نجيب الـ paper context من الـ messages
    const paperContext = chat.messages
      .filter(m => m.role === 'user')
      .slice(0, 3)
      .map(m => m.content)
      .join('\n');

    const conversationHistory = chat.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    console.log('🔵 Research chat AI response...');

    const aiResponse = await getResearchChatResponse(
      conversationHistory,
      chat.paperTitle,
      paperContext
    );

    // إضافة رد الـ AI
    chat.messages.push({ role: 'assistant', content: aiResponse });
    await chat.save();

    res.status(200).json({
      success: true,
      aiResponse,
      chat,
    });
  } catch (error) {
    console.error('🔴 Research chat error:', error.message);
    next(error);
  }
};




// @desc    Upload PDF or image file for research
// @route   POST /api/research/:id/upload
// @access  Private
exports.uploadPaperFile = async (req, res, next) => {
  try {
    const chat = await ResearchChat.findById(req.params.id);
    if (!chat) return res.status(404).json({ success: false, message: 'Not found' });
    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // تحويل الملف لـ base64
    const fileBase64 = req.file.buffer.toString('base64');
    const fileType = req.file.mimetype;

    // ✅ استخراج النص من الملف عبر الـ AI
    let extractedText = '';

    if (fileType.startsWith('image/')) {
      extractedText = await extractTextFromImage(fileBase64, fileType);
    } else if (fileType === 'application/pdf') {
      extractedText = await extractTextFromPDF(fileBase64);
    }

    // حفظ الـ extractedText
    chat.extractedText = extractedText;
    await chat.save();

    console.log('✅ File uploaded and text extracted');

    res.status(200).json({
      success: true,
      extractedText,
      message: 'File uploaded and text extracted successfully',
    });
  } catch (error) {
    console.error('🔴 Upload file error:', error.message);
    next(error);
  }
};

// @desc    Get OCR extracted text
// @route   GET /api/research/:id/ocr
// @access  Private
exports.getOcrText = async (req, res, next) => {
  try {
    const chat = await ResearchChat.findById(req.params.id);
    if (!chat) return res.status(404).json({ success: false, message: 'Not found' });
    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({
      success: true,
      extractedText: chat.extractedText || '',
      paperTitle: chat.paperTitle,
    });
  } catch (error) {
    next(error);
  }
};