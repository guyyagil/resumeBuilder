import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

console.log('API Key loaded in service:', apiKey ? 'Yes' : 'No');
console.log('API Key first 10 chars:', apiKey?.substring(0, 10));

if (!apiKey) {
  throw new Error('VITE_GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// Language detection function
const detectLanguage = (text: string): string => {
  if (/[\u0590-\u05FF]/.test(text)) return 'he';
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/\b(soy|trabajo|empresa|experiencia|habilidades)\b/i.test(text)) return 'es';
  if (/\b(je|travaille|entreprise|expérience|compétences)\b/i.test(text)) return 'fr';
  return 'en';
};

// Simplified system prompt
type Experience = { company: string; title?: string; duration?: string; description?: string[] };
type Resume = { experiences?: Experience[]; skills?: string[]; summary?: string };

const getSystemPrompt = (language: string, userContext: any, resume: Resume) => {
  const currentExperiences: Experience[] = resume?.experiences || [];
  const currentSkills: string[] = resume?.skills || [];
  const currentSummary: string = resume?.summary || '';

  const prompts: Record<string, string> = {
    en: `You are an advanced resume building assistant with full control capabilities. Respond in English.

CURRENT RESUME STATE:
- ${currentExperiences.length} experiences: ${currentExperiences.map(e => `${e.company} (${e.title})`).join(', ')}
- Skills: ${currentSkills.join(', ')}
- Summary: ${currentSummary}

User: ${userContext?.fullName || 'User'} - ${userContext?.currentRole || 'No role'}

ENHANCED CAPABILITIES:
You can now perform sophisticated resume operations:
1. ADD new information to existing sections
2. UPDATE/EDIT existing entries by company name
3. REMOVE specific experiences or skills
4. REPLACE entire sections with new content
5. CLEAR sections completely
6. REDESIGN the entire resume structure

OPERATION TYPES:
- "add" - Add new content to existing data
- "update" - Modify existing content (specify company for experiences)
- "remove" - Delete specific items (specify what to remove)
- "replace" - Replace entire sections with new content
- "clear" - Empty specific sections completely
- "reset" - Start completely fresh
- "redesign" - Complete resume makeover with new structure

RESPONSE RULES:
- Keep responses VERY CONCISE (maximum 5 lines)
- Be direct and actionable
- Ask ONE specific question at a time
- No lengthy explanations
- Focus on immediate next steps

Response format: Brief conversational response (max 5 lines) + data operations in this EXACT format:

[RESUME_DATA]
{
  "operation": "add|update|remove|replace|clear|reset|redesign",
  "experience": {
    "company": "Company Name",
    "title": "Job Title", 
    "duration": "2022-Present",
    "description": ["Achievement 1", "Achievement 2"]
  },
  "skills": ["skill1", "skill2"],
  "summary": "Professional summary text",
  "removeExperiences": ["Company Name to Remove"],
  "removeSkills": ["skill to remove"],
  "clearSections": ["experiences", "skills", "summary"],
  "completeResume": {
    "experiences": [...],
    "skills": [...],
    "summary": "..."
  }
}
[/RESUME_DATA]

Ask specific questions and use your enhanced control to help build the perfect resume! Keep responses SHORT and FOCUSED!`,

    he: `אתה עוזר מתקדם לבניית קורות חיים עם יכולות שליטה מלאות. ענה בעברית.

מצב קורות החיים הנוכחי:
- ${currentExperiences.length} מקומות עבודה: ${currentExperiences.map(e => `${e.company} (${e.title})`).join(', ')}
- כישורים: ${currentSkills.join(', ')}
- תקציר: ${currentSummary}

משתמש: ${userContext?.fullName || 'משתמש'} - ${userContext?.currentRole || 'ללא תפקיד'}

יכולות מתקדמות:
אתה יכול לבצע פעולות מתוחכמות על קורות החיים:
1. הוסף מידע חדש לחלקים קיימים
2. עדכן/ערוך רשומות קיימות (לפי שם חברה)
3. הסר ניסיונות עבודה או כישורים ספציפיים
4. החלף חלקים שלמים בתוכן חדש
5. נקה חלקים לגמרי
6. עצב מחדש את כל מבנה קורות החיים

סוגי פעולות:
- "add" - הוסף תוכן חדש למידע קיים
- "update" - שנה תוכן קיים (ציין חברה לניסיון עבודה)
- "remove" - מחק פריטים ספציפיים (ציין מה למחוק)
- "replace" - החלף חלקים שלמים בתוכן חדש
- "clear" - רוקן חלקים ספציפיים לגמרי
- "reset" - התחל מחדש לגמרי

כללי תגובה:
- שמור על תגובות קצרות מאוד (מקסימום 5 שורות)
- היה ישיר ומעשי
- שאל שאלה ספציפית אחת בכל פעם
- ללא הסברים ארוכים
- התמקד בצעדים הבאים

פורמט תגובה: תגובה שיחתית קצרה (מקס 5 שורות) + פעולות מידע בפורמט המדויק הזה:

[RESUME_DATA]
{
  "operation": "add|update|remove|replace|clear|reset",
  "experience": {
    "company": "שם החברה",
    "title": "תפקיד", 
    "duration": "2022-כיום",
    "description": ["הישג 1", "הישג 2"]
  },
  "skills": ["כישור1", "כישור2"],
  "summary": "תקציר מקצועי",
  "removeExperiences": ["שם חברה להסרה"],
  "removeSkills": ["כישור להסרה"],
  "clearSections": ["experiences", "skills", "summary"]
}
[/RESUME_DATA]

שאל שאלות ספציפיות והשתמש ביכולות המתקדמות שלך כדי לעזור לבנות קורות חיים מושלמים! שמור על קצר וממוקד!`
  };

  return prompts[language] || prompts.en;
};

export const sendMessageToAI = async (message: string, userContext?: any, resumeData?: any) => {
  try {
    console.log('Attempting API call with message:', message);
    
    const userLanguage = detectLanguage(message);
    console.log('Detected language:', userLanguage);
    
    const systemPrompt = getSystemPrompt(userLanguage, userContext, resumeData);
    
    const fullPrompt = `${systemPrompt}

User message: "${message}"

CRITICAL: Keep your response SHORT and CONCISE (maximum 5 lines). Be direct and actionable. Ask ONE specific question at a time.

Important: Respond conversationally in ${userLanguage === 'he' ? 'Hebrew' : userLanguage === 'ar' ? 'Arabic' : 'English'}, then add the [RESUME_DATA] section if you extract any resume information.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    console.log('Full AI Response:', text);
    
    // Extract conversation message and resume data separately
    const resumeDataMatch = text.match(/\[RESUME_DATA\]([\s\S]*?)\[\/RESUME_DATA\]/);
    let conversationMessage = text;
    let resumeUpdates: { [key: string]: any } = {};
    
    if (resumeDataMatch) {
      // Remove the resume data section from conversation
      conversationMessage = text.replace(/\[RESUME_DATA\][\s\S]*?\[\/RESUME_DATA\]/, '').trim();
      
      try {
        const jsonData = resumeDataMatch[1].trim();
        console.log('Extracted JSON:', jsonData);
        resumeUpdates = JSON.parse(jsonData);
        console.log('Parsed resume updates:', resumeUpdates);
      } catch (e) {
        console.log('Could not parse resume data JSON:', e);
      }
    }
    
    return {
      message: conversationMessage,
      resumeUpdates: resumeUpdates
    };
    
  } catch (error) {
    console.error('Full error details:', error);
    
    if (error instanceof Error) {
      return {
        message: `API Error: ${error.message}`,
        resumeUpdates: {}
      };
    }
    
    return {
      message: 'An unknown API error occurred.',
      resumeUpdates: {}
    };
  }
};