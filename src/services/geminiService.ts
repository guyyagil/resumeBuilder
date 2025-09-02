import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAppStore } from '../store/useAppStore';
import { parseResumeData } from '../lib/parseResumeData';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set in environment variables');

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const FORCE_LANG: 'he' = 'he';

// ---------------- Types ----------------
interface RawAIResumeData {
  operation?: string;
  experience?: any;
  skills?: string[];
  removeSkills?: string[];
  removeExperiences?: string[];
  clearSections?: string[];
  summary?: string;
  completeResume?: any;
  contact?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    title?: string;
  };
}

interface NormalizedResumePatch {
  operation: 'patch' | 'replace' | 'reset';
  experience?: {
    id?: string;
    company?: string;
    title?: string;
    duration?: string;
    description?: string[];
  };
  skills?: string[];
  removeSkills?: string[];
  removeExperiences?: string[];
  clearSections?: string[];
  summary?: string;
  completeResume?: any;
  contact?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    title?: string;
  };
}

// ---------------- Parsing helpers ----------------
const safeJsonParse = (raw: string): any | null => {
  try {
    return JSON.parse(raw);
  } catch {
    const cleaned = raw
      .replace(/^[\s`]+|[\s`]+$/g, '')
      .replace(/[“”]/g, '"')
      .replace(/,\s*([}\]])/g, '$1');
    try { return JSON.parse(cleaned); } catch { return null; }
  }
};

// Robust malformed recovery (RTL / polluted output)
const recoverMalformedResumeJson = (raw: string): any | null => {
  // Focus on region between [RESUME_DATA] tags first
  let region = raw;
  const startIdx = raw.search(/\[RESUME_DATA\]/i);
  if (startIdx !== -1) {
    region = raw.slice(startIdx + '[RESUME_DATA]'.length);
    const endIdx = region.search(/\[\/RESUME_DATA\]/i);
    if (endIdx !== -1) region = region.slice(0, endIdx);
  }
  // Strip code fences / labels / the word json
  region = region
    .replace(/```/g, ' ')
    .replace(/\bjson\b/gi, ' ')
    .replace(/\[\/?RESUME_DATA\]/gi, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim();
  // Find first '{' then balance
  const braceStart = region.indexOf('{');
  if (braceStart === -1) return null;
  let depth = 0;
  let collected = '';
  for (let i = braceStart; i < region.length; i++) {
    const ch = region[i];
    collected += ch;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  if (!collected.endsWith('}')) return null;
  // Light cleanup: remove trailing commas & fix smart quotes
  const cleaned = collected
    .replace(/[“”]/g, '"')
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/(\r?\n)+/g, '\n');
  return safeJsonParse(cleaned);
};

const normalizeResumeData = (raw: RawAIResumeData): NormalizedResumePatch => {
  const patch: NormalizedResumePatch = {
    operation: raw.operation === 'replace' || raw.operation === 'reset'
      ? raw.operation
      : 'patch'
  };

  // Experience normalization: accept "experience", "experiences" or nested forms
  let expSource: any = raw.experience ?? null;

  // If top-level object contains work/education keys, try to find them
  if (!expSource && raw && typeof raw === 'object') {
    const possibleContainers = ['experience', 'experiences', 'work', 'education', 'job', 'role', 'position'];
    for (const key of possibleContainers) {
      if ((raw as any)[key]) {
        expSource = (raw as any)[key];
        break;
      }
    }
  }

  if (Array.isArray(expSource)) expSource = expSource[0];

  if (expSource && typeof expSource === 'object') {
    // If the object itself wraps an array under common nested keys, unwrap
    const nestedKey = ['education', 'work', 'job', 'role', 'position', 'experiences', 'experience']
      .find(k => expSource[k]);
    if (nestedKey) {
      expSource = expSource[nestedKey];
      if (Array.isArray(expSource)) expSource = expSource[0];
    }

    if (expSource && typeof expSource === 'object') {
      // Normalize description to array - PRESERVE FULL SENTENCES
      let desc: string[] = [];
      if (Array.isArray(expSource.description)) {
        desc = expSource.description.map((s: string) => s.trim()).filter(Boolean);
      } else if (typeof expSource.description === 'string') {
        // Only split on clear sentence boundaries, preserve full sentences
        const sentences = expSource.description
          .split(/(?<=[.!?])\s+/)
          .map((s: string) => s.trim())
          .filter(Boolean);
        desc = sentences.length > 0 ? sentences : [expSource.description.trim()];
      }

      patch.experience = {
        id: expSource.id,
        company: (expSource.company || expSource.companyName || expSource.employer || '').trim(),
        title: (expSource.title || expSource.position || '').trim(),
        duration: expSource.duration || expSource.period || undefined,
        description: Array.isArray(desc) ? desc : []
      };
    }
  }

  if (Array.isArray(raw.skills)) patch.skills = raw.skills;
  if (Array.isArray(raw.removeSkills)) patch.removeSkills = raw.removeSkills;
  if (Array.isArray(raw.removeExperiences)) patch.removeExperiences = raw.removeExperiences;
  if (Array.isArray(raw.clearSections)) patch.clearSections = raw.clearSections;
  if (typeof raw.summary === 'string') patch.summary = raw.summary;
  if (raw.operation === 'replace' && raw.completeResume) {
    patch.completeResume = raw.completeResume;
  }
  if (raw.contact && typeof raw.contact === 'object') {
    patch.contact = {
      fullName: raw.contact.fullName?.trim(),
      email: raw.contact.email?.trim(),
      phone: raw.contact.phone?.trim(),
      location: raw.contact.location?.trim(),
      title: raw.contact.title?.trim()
    };
  }
  // Also allow contact nested inside completeResume
  if (!patch.contact && raw.completeResume?.contact) {
    patch.contact = raw.completeResume.contact;
  }

  return patch;
};

// ---------------- Apply patch to Zustand store ----------------
export const applyResumePatch = (patch: NormalizedResumePatch) => {
  const {
    addOrUpdateExperience,
    addSkills,
    removeSkills,
    replaceEntireResume,
    resetResume,
    removeExperience,
    clearAllExperiences,
    clearAllSkills,
    setSummary,
    clearSummary,
    setContactInfo
  } = useAppStore.getState();

  console.log('Applying resume patch:', patch);

  // Operation-level
  if (patch.operation === 'reset') {
    resetResume();
    return;
  }

  if (patch.operation === 'replace') {
    if (patch.completeResume) {
      replaceEntireResume({
        experiences: patch.completeResume.experiences || [],
        skills: patch.completeResume.skills || [],
        summary: patch.completeResume.summary || '',
        fullName: patch.completeResume.contact?.fullName || (patch as any).fullName || '',
        email: patch.completeResume.contact?.email || '',
        phone: patch.completeResume.contact?.phone || '',
        location: patch.completeResume.contact?.location || '',
        title: patch.completeResume.contact?.title || ''
      });
      return;
    } else {
      // Fallback: treat as patch if no full structure supplied
      console.warn('Replace operation without completeResume – falling back to patch merge.');
    }
  }

  // Clears
  if (patch.clearSections?.includes('experiences')) clearAllExperiences();
  if (patch.clearSections?.includes('skills')) clearAllSkills();
  if (patch.clearSections?.includes('summary')) clearSummary();

  // Experience add/update
  if (patch.experience?.company) {
    addOrUpdateExperience({
      id: patch.experience.id,
      company: patch.experience.company,
      title: patch.experience.title || '',
      duration: patch.experience.duration || '',
      description: patch.experience.description || []
    });
  }

  // Remove experiences
  patch.removeExperiences?.forEach(key => removeExperience(key));

  // Skills
  if (patch.skills && patch.skills.length) addSkills(patch.skills);
  if (patch.removeSkills && patch.removeSkills.length) removeSkills(patch.removeSkills);

  // Summary
  if (typeof patch.summary === 'string' && patch.summary.trim()) {
    setSummary(patch.summary.trim());
  }
  if (patch.contact) {
    setContactInfo(patch.contact);
  }
};

// ---------------- Prompt builder ----------------
type Experience = { company: string; title?: string; duration?: string; description?: string[] };
type Resume = { experiences?: Experience[]; skills?: string[]; summary?: string };

const buildPlainTextResume = (resume: any): string => {
  const lines: string[] = [];
  if (resume.fullName || resume.title) {
    lines.push(`${resume.fullName || ''} ${resume.title ? '— ' + resume.title : ''}`.trim());
  }
  if (resume.summary) {
    lines.push('--- תקציר ---');
    lines.push(resume.summary);
  }
  if (resume.experiences?.length) {
    lines.push('--- ניסיון ---');
    resume.experiences.forEach((e: any, i: number) => {
      lines.push(`${i + 1}. ${e.company || ''}${e.title ? ' – ' + e.title : ''}${e.duration ? ' (' + e.duration + ')' : ''}`);
      (e.description || []).slice(0, 8).forEach((d: string) => lines.push('• ' + d));
    });
  }
  if (resume.skills?.length) {
    lines.push('--- כישורים ---');
    lines.push(resume.skills.join(', '));
  }
  return lines.join('\n');
};

const getSystemPrompt = (
  // language is now always 'he'
  language: string,
  userContext: any,
  resume: Resume,
  chatMessages?: any[]
) => {
  const currentExperiences: any[] = resume?.experiences || [];
  const currentSkills: string[] = resume?.skills || [];
  const currentSummary: string = resume?.summary || '';
  const targetJobPosting: string = userContext?.targetJobPosting || '';
  let conversationMemory = '';

  if (chatMessages?.length) {
    const aiQ = chatMessages.filter(m => m.type === 'ai').slice(-12).map(m => m.content).join(' | ');
    const userA = chatMessages.filter(m => m.type === 'user').slice(-12).map(m => m.content).join(' | ');
    conversationMemory = [
      'זיכרון שיחה:',
      `שאלות AI: ${aiQ}`,
      `תשובות משתמש: ${userA}`
    ].join('\n');
  }

  const plainTextCV = buildPlainTextResume(resume);

  const baseHebrewLines = [
    'אתה מדריך לשיפור קורות חיים (Career Resume Improvement Guide).',
    'מטרתך: לשפר בהדרגה את קורות החיים הקיימים כדי שיותאמו בצורה הטובה ביותר למשרה / דרישות היעד.',
    '',
    '{CURRENT_CV_TEXT}:',
    '------------------',
    plainTextCV || '(קורות חיים ריקים)',
    '',
    '{TARGET_JOB}:',
    '------------------',
    targetJobPosting || '(לא סופק טקסט משרה)',
    '',
    'הנחיות התאמה:',
    '- שפר ניסוח, הוסף תוצאות מדידות, מיקוד תועלת ודיוק מינוח.',
    '- שמור שמות טכנולוגיות / ספריות / חברות כפי שהן (באנגלית אם כך מופיעות).',
    '- אל תמציא חברות או טכנולוגיות שלא הופיעו או שלא נאמרו במפורש ע"י המשתמש.',
    '- אל תחליף תאריכים קיימים בלי הצדקה.',
    '- בצע שינויים מדורגים בלבד.',
    '- אם אין שינוי ממשי – אל תחזיר את השדה.',
    '- תמיד בלוק [RESUME_DATA] אחד.',
    '- שאל שאלה הבהרה אחת בלבד אם חסר מידע קריטי.',
    '',
    'אותנטיות:',
    '- אין לכתוב רצון לעבור תחום / לחפש הזדמנות / להתעניין בתפקיד.',
    '- השתמש במשרת היעד רק כדי להבין מה להדגיש.'
  ];

  const rulesLines = [
    'כללי תגובה:',
    '- עד 6 שורות טקסט לפני בלוק הנתונים.',
    '- תמיד [RESUME_DATA] אחד.',
    '- החזר רק שדות שעודכנו (patch) או מבנה מלא (replace).',
    '- פורמט מחייב: שורה עם [RESUME_DATA] ואז JSON תקין ואז [/RESUME_DATA].',
    '- אין backticks ואין המילה json.',
    '- description: 1–5 משפטים מלאים בעברית (מערך string). כל פריט במערך הוא משפט שלם שמתחיל בפועל עבר ("פיתחתי", "הובלתי", "ניהלתי") ומסתיים בנקודה.',
    '- אסור לשים רק מילות מפתח או רשימות נקודות בודדות ב-description.',
    '- skills: רק טכנולוגיות באנגלית כמו React, Node.js, Python (מערך נפרד).',
    '- כל התיאורים/summary בעברית (טכנולוגיות נשארות באנגלית).',
    '- אין מספרים מדויקים מומצאים.',
    '- סיים תמיד את חלק ההסבר לפני בלוק הנתונים בשאלה מדריכה אחת שמקדמת את השיחה.'
  ];

  const translationRuleLines = [
    'הוראות שפה:',
    '- טקסט חופשי בעברית תקנית.',
    '- אין לתרגם שמות חברות / טכנולוגיות.',
    '- אם המשתמש כותב באנגלית: תרגם לעברית חוץ מ-proper nouns.'
  ];

  return [
    baseHebrewLines.join('\n'),
    conversationMemory,
    translationRuleLines.join('\n'),
    rulesLines.join('\n')
  ].filter(Boolean).join('\n\n');
};

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
    // Primary parse
    const primary = parseResumeData(text);
    let resumeUpdates: NormalizedResumePatch | undefined;
    let conversationMessage = (primary.messageText || text).trim();
    if (primary.patch) {
      // Normalize + apply
      const rawPatch = primary.patch as any;
      // Convert first experience if 'experience' singular
      if (rawPatch.experience && !rawPatch.experiences) {
        rawPatch.experiences = [rawPatch.experience];
      }
      // If only a single experience array and no explicit operation, keep patch
      resumeUpdates = normalizeResumeData(rawPatch);
      applyResumePatch(resumeUpdates);
    } else if (primary.error) {
      console.warn('Primary parse failed:', primary.error);
      const recovered = recoverMalformedResumeJson(text);
      if (recovered) {
        console.log('Recovered JSON:', recovered);
        resumeUpdates = normalizeResumeData(recovered);
        applyResumePatch(resumeUpdates);
        // Remove recovered block from message
        conversationMessage = text
          .replace(/\[RESUME_DATA\][\s\S]*?\[\/RESUME_DATA\]/i, '')
          .replace(JSON.stringify(recovered), '')
          .trim();
      }
    }
    return { message: conversationMessage, resumeUpdates: resumeUpdates || {} };
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
      // If still not found, try first line that has 2 words and no digits
      if (!fullName) {
        fullName = firstLines.find(l => /^\D+$/.test(l) && l.split(/\s+/).length === 2);
      }
      return { email, phone, fullName };
    };
    const heur = quickExtract(rawText);
    if (heur.fullName || heur.email || heur.phone) {
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
      '    "contact": { "fullName": "שם", "title": "תפקיד" },',
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

    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    const parsed = parseResumeData(text);
    
    if (parsed.patch) {
      const patch = normalizeResumeData(parsed.patch as any);
      applyResumePatch(patch);
      return { ok: true, raw: text, patch };
    }
    
    const recovered = recoverMalformedResumeJson(text);
    if (recovered) {
      const patch = normalizeResumeData(recovered);
      applyResumePatch(patch);
      return { ok: true, raw: text, patch, recovered: true };
    }
    
    return { ok: false, error: parsed.error || 'NO_JSON', raw: text };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'UNKNOWN',
    };
  }
};

// Extract tech-only lines from description into skills
const refineResumePatch = (patch: NormalizedResumePatch): NormalizedResumePatch => {
  if (!patch.experience?.description || !Array.isArray(patch.experience.description)) return patch;
  const desc = patch.experience.description;
  const extractedSkills: string[] = [];
  const keep: string[] = [];

  const TECH_TOKEN = /^[A-Za-z][A-Za-z0-9+.#-]{1,}$/; // e.g. React, Node.js, C#, Next.js
  const hasHebrew = (s: string) => /[\u0590-\u05FF]/.test(s);

  for (const line of desc) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // ALWAYS keep Hebrew sentences that end with proper punctuation
    if (hasHebrew(trimmed) && /[.!?]$/.test(trimmed) && trimmed.length > 10) {
      keep.push(trimmed);
      continue;
    }

    // ALWAYS keep lines that look like complete Hebrew sentences (verb + content)
    const hebrewVerbs = /^(פיתחתי|הובלתי|ניהלתי|יצרתי|בניתי|עבדתי|ביצעתי|השגתי|ייעלתי|שיפרתי|ליוויתי|תחזקתי|אופטמזטי|הטמעתי)/;
    if (hasHebrew(trimmed) && (hebrewVerbs.test(trimmed) || trimmed.length > 15)) {
      keep.push(trimmed);
      continue;
    }

    // Only extract as skills if it's clearly a tech list
    const tokens = trimmed.split(/[,/|•;]+|\s{2,}/).map(t => t.trim()).filter(Boolean);
    
    // Very strict criteria for tech extraction
    const isPureTechList = tokens.length >= 2 && 
      tokens.length <= 6 &&
      tokens.every(t => 
        TECH_TOKEN.test(t.replace(/\.$/, '')) && 
        !hasHebrew(t) &&
        t.length >= 2 &&
        t.length <= 20
      ) &&
      !hasHebrew(trimmed) &&
      trimmed.length < 100 &&
      !/^[\u0590-\u05FF]/.test(trimmed); // doesn't start with Hebrew

    if (isPureTechList) {
      extractedSkills.push(...tokens.map(t => t.replace(/\.$/, '')));
    } else {
      // Default: keep everything else as description
      keep.push(trimmed);
    }
  }

  if (extractedSkills.length) {
    // Deduplicate & merge
    const existing = new Set((patch.skills || []).map(s => s.toLowerCase()));
    extractedSkills.forEach(s => {
      if (!existing.has(s.toLowerCase())) {
        patch.skills = [...(patch.skills || []), s];
        existing.add(s.toLowerCase());
      }
    });
    patch.experience.description = keep;
  }
  return patch;
};
