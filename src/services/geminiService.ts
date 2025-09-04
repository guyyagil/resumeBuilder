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
    console.log('Raw AI Response:\n---\n', text, '\n---');

    const { patch, messageText, error, rawJson } = parseResumeData(text);

    if (error) {
      console.warn(`Parsing Warning: ${error}`, { rawJson });
    }

    const conversationMessage = stripSimpleMarkdown(messageText);

    if (patch) {
      console.log('Applying resume updates via handler:', patch);
      // We can create a dummy addChatMessage as it's not used for user-facing messages here
      const internalAddChatMessage = (msg: string, type: 'ai' | 'user') => console.log(`[Internal ${type}]: ${msg}`);
      await handleResumeUpdates(patch, internalAddChatMessage);
    }

    return { message: conversationMessage, resumeUpdates: patch || {} };

  } catch (error) {
    console.error('AI service error:', error);
    return {
      message: 'שגיאה בתקשורת עם ה-AI. נסה שוב.',
      resumeUpdates: {}
    };
  }
};

// ---------------- Public API (extraction) - REFINED ----------------
export const extractResumeFromPlainText = async (rawText: string) => {
  try {
    const promptParts = [
      'אתה מומחה בהמרת טקסט גולמי של קורות חיים לפורמט JSON מובנה.',
      'המשימה שלך היא לנתח את הטקסט המצורף, לזהות את כל החלקים השונים (פרטי קשר, תקציר, ניסיון תעסוקתי, כישורים) ולהחזיר אותם כאובייקט JSON שלם.',
      'הקפד על הכללים הבאים:',
      '1. **פעולה (operation)**: תמיד תהיה "replace".',
      '2. **אובייקט ראשי (completeResume)**: כל המידע ירוכז תחת אובייקט זה.',
      '3. **פרטי קשר (contact)**: חלץ שם מלא, אימייל, טלפון, ומיקום. אם יש תפקיד כללי בולט (כמו "מהנדס תוכנה" בכותרת), שים אותו בשדה "title".',
      '4. **ניסיון (experiences)**: עבור כל תפקיד, חלץ חברה, תפקיד, משך זמן (למשל "2020-2022" או "3 שנים"), ותיאור. הפוך את התיאור למערך של משפטים.',
      '5. **כישורים (skills)**: אסוף את כל הכישורים, גם מטקסטים וגם מרשימות ייעודיות, למערך אחד.',
      '6. **תקציר (summary)**: אם קיים חלק של תקציר או "אודות", חלץ אותו. אם לא, צור תקציר קצר (2-3 שורות) על סמך הניסיון העדכני ביותר.',
      '7. **שפה**: כל ערכי הטקסט ב-JSON חייבים להיות בעברית.',
      '',
      '=== פורמט תגובה מחייב ===',
      'החזר אך ורק בלוק JSON אחד עטוף ב-[RESUME_DATA]...[/RESUME_DATA]. ללא טקסט נוסף לפני או אחרי.',
      '[RESUME_DATA]',
      '{',
      '  "operation": "replace",',
      '  "completeResume": {',
      '    "contact": { "fullName": "...", "email": "...", "phone": "...", "location": "...", "title": "..." },',
      '    "summary": "...",',
      '    "experiences": [',
      '      { "company": "...", "title": "...", "duration": "...", "description": ["..."] }',
      '    ],',
      '    "skills": ["...", "..."]',
      '  }',
      '}',
      '[/RESUME_DATA]',
      '',
      '=== טקסט קורות החיים לניתוח ===',
      rawText.slice(0, 25000),
    ];
    const prompt = promptParts.join('\n');

    console.log('Sending prompt to AI for initial CV extraction...');
    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    console.log('AI response for CV extraction:', text);
    
    const parsed = parseResumeData(text);
    console.log('Parsed initial resume data:', parsed);

    if (parsed.patch) {
      console.log('Applying initial parsed patch via handler...');
      // Use a dummy message handler as this is a background process
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

