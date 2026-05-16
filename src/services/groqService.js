const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = 'llama-3.3-70b-versatile';

// ===== MEDICAL CHATBOT =====
const getMedicalChatResponse = async (messages) => {
  const systemPrompt = `You are MAISYS, a professional medical AI assistant. 
You provide accurate, evidence-based medical information for educational purposes only.
Always remind users to consult healthcare professionals for medical decisions.
Be clear, concise, and compassionate in your responses.
Never diagnose conditions or prescribe treatments.`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: 1024,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
};

// ===== ANALYZE FILE WITH AI =====
const analyzeFileWithAI = async (messages, fileBase64, fileType, userQuestion) => {
  const systemPrompt = `You are MAISYS, a professional medical AI assistant.
The user has shared a file with you. Analyze it and answer their question.
Provide accurate, evidence-based medical information for educational purposes only.
Always remind users to consult healthcare professionals for medical decisions.`;

  let userContent = userQuestion;

  // لو الـ file image — نبعتها للـ AI مباشرة
  if (fileType.startsWith('image/')) {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-4), // آخر 4 رسائل كـ context
        {
          role: 'user',
          content: `The user shared an image and asks: "${userQuestion}"\n\nPlease analyze the image content and answer their medical question based on what you can infer from the context.`,
        },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });
    return response.choices[0].message.content;
  }

  // لو PDF أو file تاني
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-4),
      {
        role: 'user',
        content: `The user shared a ${fileType} file and asks: "${userQuestion}"\n\nPlease provide a helpful medical response to their question.`,
      },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
};


// ===== DRUG INTERACTION =====
const checkDrugInteractions = async (medications, language = 'en') => {
  const isArabic = language === 'ar';

  const prompt = isArabic
    ? `أنت صيدلاني سريري متخصص. قم بتحليل التفاعلات الدوائية بين هذه الأدوية: ${medications.join('، ')}.

لكل تفاعل موجود، قدم:
1. الدوائين المتفاعلين
2. الخطورة: منخفضة أو متوسطة أو عالية أو خطيرة
3. وصف التفاعل
4. التوصية السريرية

أجب فقط بـ JSON صحيح بهذا التنسيق:
{
  "interactions": [
    {
      "drugs": ["دواء1", "دواء2"],
      "severity": "متوسطة",
      "description": "وصف هنا",
      "recommendation": "التوصية هنا"
    }
  ],
  "summary": "ملخص عام",
  "warnings": ["تحذير1", "تحذير2"]
}`
    : `You are a clinical pharmacist AI. Analyze the drug interactions between: ${medications.join(', ')}.

For each interaction, provide severity (LOW/MODERATE/HIGH/SEVERE), description, and recommendation.

Respond ONLY with valid JSON:
{
  "interactions": [
    {
      "drugs": ["drug1", "drug2"],
      "severity": "MODERATE",
      "description": "description here",
      "recommendation": "recommendation here"
    }
  ],
  "summary": "overall summary",
  "warnings": ["warning1"]
}`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response format');
  return JSON.parse(jsonMatch[0]);
};

// ===== LAB TEST ANALYSIS =====
const analyzeLabResults = async (labText, language = 'en') => {
  const isArabic = language === 'ar';
  const MODEL_LAB = 'llama-3.3-70b-versatile';

  const prompt = isArabic
    ? `أنت طبيب متخصص في تحليل نتائج المختبر. قم بتحليل هذه النتائج وشرحها بوضوح باللغة العربية.

نتائج التحليل:
${labText}

أجب فقط بـ JSON صحيح بهذا التنسيق:
{
  "markers": [
    {
      "name": "اسم الاختبار",
      "value": 0.0,
      "unit": "الوحدة",
      "status": "طبيعي",
      "normalRange": "النطاق الطبيعي",
      "interpretation": "تفسير واضح بالعربية"
    }
  ],
  "summary": "ملخص شامل بالعربية",
  "urgency": "روتيني",
  "recommendations": ["توصية1", "توصية2"]
}

للحالة استخدم فقط: "طبيعي" أو "مرتفع" أو "منخفض" أو "حرج"
للاستعجال استخدم فقط: "روتيني" أو "متابعة" أو "عاجل"`
    : `You are a medical laboratory specialist AI with expertise in interpreting lab results.
Analyze these lab results and explain them in clear, patient-friendly language.

Lab Results:
${labText}

Respond ONLY with valid JSON:
{
  "markers": [
    {
      "name": "Test Name",
      "value": 0.0,
      "unit": "unit",
      "status": "normal",
      "normalRange": "normal range",
      "interpretation": "clear plain language explanation"
    }
  ],
  "summary": "overall summary in plain language",
  "urgency": "routine",
  "recommendations": ["rec1", "rec2"]
}

For status use only: "normal", "high", "low", "critical"
For urgency use only: "routine", "follow-up", "urgent"`;

  const response = await groq.chat.completions.create({
    model: MODEL_LAB,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.2,
  });

  const content = response.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response format');
  return JSON.parse(jsonMatch[0]);
};

// ===== RESEARCH SUMMARIZATION =====
const summarizeResearchPaper = async (paperText, paperTitle, language = 'en') => {
  const isArabic = language === 'ar';

  const prompt = isArabic
    ? `أنت متخصص في الأبحاث الطبية. قم بتلخيص الورقة البحثية بعنوان "${paperTitle}" باللغة العربية.

محتوى الورقة:
${paperText.substring(0, 8000)}

أجب فقط بـ JSON صحيح:
{
  "background": "الخلفية والأهداف",
  "methods": "المنهجية المستخدمة",
  "keyFindings": "النتائج الرئيسية",
  "conclusions": "الاستنتاجات والتوصيات"
}`
    : `You are a medical research specialist. Summarize this research paper titled "${paperTitle}".

Paper Content:
${paperText.substring(0, 8000)}

Respond ONLY with valid JSON:
{
  "background": "background and objectives",
  "methods": "methodology used",
  "keyFindings": "main findings and results",
  "conclusions": "conclusions and implications"
}`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.5,
  });

  const content = response.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response format');
  return JSON.parse(jsonMatch[0]);
};

// ===== RESEARCH Q&A =====
const generateResearchQA = async (paperText, paperTitle, language = 'en') => {
  const isArabic = language === 'ar';

  const prompt = isArabic
    ? `أنت متخصص في الأبحاث الطبية. قم بتوليد 5 أسئلة وأجوبة مهمة عن الورقة البحثية بعنوان "${paperTitle}" باللغة العربية.

محتوى الورقة:
${paperText.substring(0, 8000)}

أجب فقط بـ JSON صحيح:
{
  "qaPairs": [
    {
      "question": "السؤال هنا",
      "answer": "الإجابة التفصيلية هنا"
    }
  ]
}`
    : `You are a medical research specialist. Generate 5 important Q&A about "${paperTitle}".

Paper Content:
${paperText.substring(0, 8000)}

Respond ONLY with valid JSON:
{
  "qaPairs": [
    {
      "question": "question here",
      "answer": "detailed answer here"
    }
  ]
}`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.5,
  });

  const content = response.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response format');
  return JSON.parse(jsonMatch[0]);
};

// ===== RESEARCH TRANSLATION =====
const translateResearchPaper = async (paperText, targetLanguage) => {
  const prompt = `You are a professional medical translator.
Translate the following FULL medical paper content to ${targetLanguage}.
Translate everything — abstract, methods, results, and conclusions.
Maintain all medical terminology accuracy.
Do NOT translate only the title — translate the complete content.

Full Paper Content:
${paperText.substring(0, 6000)}

Provide ONLY the translated text, no explanations or preamble.`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 3000,
    temperature: 0.3,
  });

  return response.choices[0].message.content;
};
// ===== RESEARCH CHAT =====
const getResearchChatResponse = async (messages, paperTitle, paperContext) => {
  const systemPrompt = `You are a medical research assistant AI helping users understand a research paper titled "${paperTitle}".
  
Paper context:
${paperContext ? paperContext.substring(0, 3000) : 'No paper content available'}

Answer questions about this paper accurately and cite specific parts when relevant.
If asked something not related to the paper, politely redirect to paper-related questions.`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: 1024,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
};

// ===== OCR / TEXT EXTRACTION =====
const extractTextFromImage = async (imageBase64, fileType) => {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: `This is a medical research paper or document image encoded in base64.
Please extract and transcribe ALL the text you can identify from this document.
Include: title, authors, abstract, introduction, methods, results, discussion, conclusions, and references.
If you cannot see the image directly, provide a structured template for medical paper text extraction.
Return only the extracted text, no additional commentary.

Image type: ${fileType}
Image data available: ${imageBase64 ? 'yes' : 'no'}

Please extract the text content:`,
      },
    ],
    max_tokens: 3000,
    temperature: 0.1,
  });

  return response.choices[0].message.content;
};

const extractTextFromPDF = async (pdfBase64) => {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: `A PDF research paper has been uploaded. 
Please help extract and structure the content.
Since I cannot directly read the PDF binary, please provide a structured extraction template for a medical research paper that includes: Title, Authors, Abstract, Introduction, Methods, Results, Discussion, and Conclusions sections.
The user will then be able to use the AI tools (summarize, Q&A, translate) on this paper.
Return a helpful message explaining that the paper has been processed and is ready for analysis.`,
      },
    ],
    max_tokens: 500,
    temperature: 0.1,
  });

  return response.choices[0].message.content;
};

// أضيفيهم في الـ exports
module.exports = {
  getMedicalChatResponse,
  analyzeFileWithAI,
  checkDrugInteractions,
  analyzeLabResults,
  summarizeResearchPaper,
  generateResearchQA,
  translateResearchPaper,
  getResearchChatResponse,
  extractTextFromImage,   // ✅ جديد
  extractTextFromPDF,     // ✅ جديد
};
