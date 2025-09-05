import { geminiModel as model } from './aiClient';
import { parseResumeData } from '../lib/parseResumeData';
import { getSystemPrompt } from './prompts';
import { refineResumePatch } from './parsers';
import type { Resume } from '../types';
import { handleResumeUpdates } from '../utils/resumeUpdateHandler';

// Remove common Markdown markers from free text
const stripSimpleMarkdown = (input: string) =>
  (input || '')
    // bold/italic markers
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // headings and list stars/dashes at line start
    .replace(/^[ \t]*#{1,6}[ \t]*/gm, '')
    .replace(/^[ \t]*[-*][ \t]+/gm, '• ')
    // collapse multiple spaces
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

// ---------------- Public API ----------------
export const sendMessageToAI = async (
  message: string,
  userContext?: any,
  resumeData?: Resume,
  chatMessages?: any[]
) => {
  try {
    const systemPrompt = getSystemPrompt('he', userContext, resumeData || {}, chatMessages);
    const fullPrompt = `${systemPrompt}\n\nהודעת משתמש: "${message}"`;

    const result = await model.generateContent(fullPrompt);
    const text = (await result.response).text();
    console.log('🤖 Raw AI Response:\n---\n', text, '\n---');

    const { patch, messageText, error, rawJson } = parseResumeData(text);

    if (error) {
      console.warn(`⚠️ Parsing Warning: ${error}`, { rawJson });
      // Still continue with the message even if JSON parsing failed
    }

    // Ensure we have a meaningful conversation message
    let conversationMessage = stripSimpleMarkdown(messageText);
    
    // If message is too short or generic, enhance it
    if (!conversationMessage || conversationMessage.length < 15) {
      if (patch?.operation === 'remove' || patch?.removeExperiences || patch?.removeSkills) {
        conversationMessage = 'מחקתי את הפריטים שביקשת. האם זה נראה טוב עכשיו?';
      } else if (patch?.operation === 'clear') {
        conversationMessage = 'ניקיתי את החלק שביקשת. רוצה להתחיל לבנות אותו מחדש?';
      } else if (patch?.experience) {
        conversationMessage = `הוספתי את הניסיון בחברת ${patch.experience.company}. איך היה התפקיד הזה?`;
      } else if (patch?.skills?.length) {
        conversationMessage = `הוספתי ${patch.skills.length} כישורים חדשים לקורות החיים שלך!`;
      } else if (patch?.summary) {
        conversationMessage = 'עדכנתי את התקציר המקצועי שלך. נראה טוב?';
      } else {
        conversationMessage = 'מה עוד תרצה לספר לי על הקריירה שלך?';
      }
    }

    // Apply resume updates if we have a patch
    if (patch) {
      console.log('📝 Applying resume updates via handler:', patch);
      const internalAddChatMessage = (msg: string, type: 'ai' | 'user') => 
        console.log(`[Internal ${type.toUpperCase()}]: ${msg}`);
      await handleResumeUpdates(patch, internalAddChatMessage);
    }

    return { 
      message: conversationMessage, 
      resumeUpdates: patch || {} 
    };

  } catch (error) {
    console.error('🚨 AI service error:', error);
    return {
      message: 'מצטער, הייתה לי בעיה טכנית. בוא ננסה שוב?',
      resumeUpdates: {}
    };
  }
};

// ---------------- Public API (extraction) - REFINED ----------------
export const extractResumeFromPlainText = async (rawText: string) => {
  try {
    const promptParts = [
      'אתה יועץ קריירה ומומחה לכתיבת קורות חיים. משימתך היא להפוך טקסט גולמי של קורות חיים למסמך JSON מובנה, מקצועי ומשופר.',
      'נתח את הטקסט המצורף ופעל לפי הכללים הבאים בקפדנות:',
      '1. **העשרת תוכן**: אל תעתיק רק את המידע. שפר אותו. אם תיאור תפקיד חסר או קצר מדי (למשל, מכיל רק את שם החברה והתפקיד), חובה עליך לכתוב תיאור מקצועי של 1-2 משפטים המתארים את מהות התפקיד על סמך שם התפקיד.',
      '2. **דיוק בפרטים**: השתמש אך ורק במידע האמיתי מהטקסט (שמות, חברות, תאריכים). אם אתה מזהה מידע שנראה כמו placeholder (למשל, "your_email@example.com"), התעלם ממנו והשאר את השדה ריק.',
      '3. **סיכום מקצועי**: אם חסר תקציר, כתוב אחד בעצמך (2-3 שורות) המסכם את הניסיון והכישורים הבולטים של המועמד.',
      '4. **מבנה קפדני**: החזר אך ורק אובייקט JSON אחד בתוך תגית [RESUME_DATA]. אל תוסיף שום טקסט הסבר לפני או אחרי התגית.',
      '',
      '=== דוגמה למבנה התגובה ===',
      '[RESUME_DATA]',
      '{',
      '  "operation": "replace",',
      '  "completeResume": {',
      '    "contact": { "fullName": "שם מהמסמך", "email": "מייל מהמסמך", "phone": "טלפון מהמסמך", "location": "מיקום מהמסמך", "title": "תפקיד נוכחי מהמסמך" },',
      '    "summary": "תקציר מקצועי משופר או חדש...",',
      '    "experiences": [',
      '      { "company": "שם חברה", "title": "שם תפקיד", "duration": "תקופת העסקה", "description": ["תיאור משופר של התפקיד..."] }',
      '    ],',
      '    "skills": ["כישורים שנאספו מהטקסט..."]',
      '  }',
      '}',
      '[/RESUME_DATA]',
      '',
      '=== קורות החיים לניתוח ===',
      rawText.slice(0, 25000),
    ];
    const prompt = promptParts.join('\n');

    console.log('Sending enhanced prompt to AI for initial CV extraction...');
    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    console.log('AI response for CV extraction:', text);
    
    const parsed = parseResumeData(text);
    console.log('Parsed initial resume data:', parsed);

    if (parsed.patch) {
      console.log('Applying initial parsed patch via handler...');
      const addChatMessage = (msg: string, type: 'ai' | 'user') => {
        console.log(`[Initial Extraction - ${type.toUpperCase()}]: ${msg}`);
      };
      
      await handleResumeUpdates(parsed.patch, addChatMessage);
      console.log('Successfully applied initial resume patch');
      return { ok: true, raw: text, patch: parsed.patch };
    }

    console.error('Failed to parse or recover initial resume data:', parsed.error);
    return { ok: false, error: parsed.error || 'NO_JSON', raw: text };

  } catch (err) {
    console.error('Error in extractResumeFromPlainText:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'UNKNOWN',
    };
  }
};

