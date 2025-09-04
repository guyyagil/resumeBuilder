import { geminiModel as model } from './aiClient';
import { parseResumeData } from '../lib/parseResumeData';
import { getSystemPrompt } from './prompts';
import { recoverMalformedResumeJson, refineResumePatch } from './parsers';
import type { Resume } from '../types';
import { handleResumeUpdates } from '../utils/resumeUpdateHandler';

const FORCE_LANG: 'he' = 'he';

// ---------------- Public API ----------------
export const sendMessageToAI = async (
  message: string,
  userContext?: any,
  resumeData?: Resume,
  chatMessages?: any[]
) => {
  try {
    const lang = FORCE_LANG;
    const systemPrompt = getSystemPrompt(lang, userContext, resumeData || {}, chatMessages);

    const fullPrompt = `${systemPrompt}
    
הודעת משתמש (יתכן באנגלית או בעברית – התוצר בעברית): "${message}"

זכור: תמיד לכלול בלוק [RESUME_DATA] גם אם עדכון יחיד.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    console.log('Raw AI text:', text);

    const primary = parseResumeData(text);

    let resumeUpdates: any = {};
    let conversationMessage: string = (primary.messageText || text).trim();

    // Create a simple addChatMessage function for the handler
    const addChatMessage = (msg: string, type: 'ai' | 'user') => {
      console.log(`[${type.toUpperCase()}]: ${msg}`);
    };

    if (primary.patch) {
      console.log('Refining parsed patch (extract tech lists -> skills, strip from descriptions)...');
      try {
        await refineResumePatch(primary.patch as any);
      } catch (err) {
        console.warn('Refiner failed:', err);
      }
      console.log('Applying resume updates via handler:', primary.patch);
      await handleResumeUpdates(primary.patch as any, addChatMessage);
      resumeUpdates = primary.patch;
    } else if (primary.error) {
      console.warn('Primary parse failed:', primary.error);
      const recovered = recoverMalformedResumeJson(text);
      if (recovered) {
        console.log('Recovered JSON:', recovered);
        try {
          await refineResumePatch(recovered as any);
        } catch (err) {
          console.warn('Refiner failed on recovered JSON:', err);
        }
        await handleResumeUpdates(recovered, addChatMessage);
        resumeUpdates = recovered;
        conversationMessage = text
          .replace(/\[RESUME_DATA\][\s\S]*?\[\/RESUME_DATA\]/gi, '')
          .replace(JSON.stringify(recovered), '')
          .replace(/\{[\s\S]*?\}/g, '') // Remove any remaining JSON
          .replace(/\n\s*\n/g, '\n') // Remove multiple empty lines
          .trim();
      }
    }

    return { message: conversationMessage, resumeUpdates };
  } catch (error) {
    console.error('AI error:', error);
    return {
      message: error instanceof Error ? `API Error: ${error.message}` : 'Unknown API error.',
      resumeUpdates: {}
    };
  }
};

// ---------------- Public API (extraction) ----------------
export const extractResumeFromPlainText = async (rawText: string) => {
  try {
    // Local quick contact extraction before AI (best-effort)
    const quickExtract = (text: string) => {
      const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
      const phone =
        text.match(/(?:\+972[-\s]?|0)(?:5\d[-\s]?\d{3}[-\s]?\d{4})/)?.[0] ||
        text.match(/(?:\+?\d{1,3}[-\s]?)?(?:\d{2,4}[-\s]?){2,4}\d{2,4}/)?.[0];
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const firstLines = lines.slice(0, 8).filter(l => l.length < 50);
      const namePattern = /^[\u0590-\u05FFA-Za-z]+([ '\-][\u0590-\u05FFA-Za-z]{2,}){0,3}$/;
      let fullName = firstLines.find(l => namePattern.test(l) && !/@/.test(l) && l.split(' ').length <= 4);
      if (!fullName) {
        fullName = firstLines.find(l => /^\D+$/.test(l) && l.split(/\s+/).length === 2);
      }
      return { email, phone, fullName };
    };
    const heur = quickExtract(rawText);
    if (heur.fullName || heur.email || heur.phone) {
      // Lazy import to avoid circular dependencies
      const { useAppStore } = await import('../store/useAppStore');
      useAppStore.getState().setContactInfo({
        fullName: heur.fullName,
        email: heur.email,
        phone: heur.phone,
      });
    }

    const promptParts = [
      'אתה ממיר טקסט קורות חיים לפלט מובנה.',
      'החזר בדיוק בלוק אחד בין [RESUME_DATA] ו-[/RESUME_DATA].',
      'keys באנגלית; טקסט בעברית.',
      'אין backticks.',
      '',
      '[RESUME_DATA]',
      '{',
      '  "operation": "replace",',
      '  "completeResume": {',
      '    "contact": { "fullName": "שם", "title": "תפקיד", "location": "תל אביב" },',
      '    "experiences": [',
      '      {',
      '        "company": "Company",',
      '        "title": "Role",',
      '        "duration": "2021-2023",',
      '        "description": ["משפט על התפקיד."]',
      '      }',
      '    ],',
      '    "skills": ["React","Node.js"],',
      '    "summary": "תקציר קצר."',
      '  }',
      '}',
      '[/RESUME_DATA]',
      '',
      '[SOURCE_RESUME_TEXT]',
      rawText.slice(0, 25000),
      '[/SOURCE_RESUME_TEXT]'
    ];
    const prompt = promptParts.join('\n');

    console.log('Sending prompt to AI for CV extraction...');
    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    console.log('AI response for CV extraction:', text);
    
    const parsed = parseResumeData(text);
    console.log('Parsed resume data:', parsed);

    if (parsed.patch) {
      console.log('Refining parsed patch before applying...');
      try { await refineResumePatch(parsed.patch as any); } catch (err) { console.warn('Refiner failed:', err); }
      console.log('Applying parsed patch via handler...');
      const addChatMessage = (msg: string, type: 'ai' | 'user') => {
        console.log(`[${type.toUpperCase()}]: ${msg}`);
      };
      
      await handleResumeUpdates(parsed.patch as any, addChatMessage);
      console.log('Successfully applied resume patch');
      return { ok: true, raw: text, patch: parsed.patch };
    }

    console.log('Primary parse failed, attempting recovery...');
    const recovered = recoverMalformedResumeJson(text);
    if (recovered) {
      console.log('Recovered malformed JSON:', recovered);
      const addChatMessage = (msg: string, type: 'ai' | 'user') => {
        console.log(`[${type.toUpperCase()}]: ${msg}`);
      };
      
      await handleResumeUpdates(recovered, addChatMessage);
      console.log('Successfully applied recovered patch');
      return { ok: true, raw: text, patch: recovered, recovered: true };
    }

    console.error('Failed to parse or recover resume data');
    return { ok: false, error: parsed.error || 'NO_JSON', raw: text };
  } catch (err) {
    console.error('Error in extractResumeFromPlainText:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'UNKNOWN',
    };
  }
};

