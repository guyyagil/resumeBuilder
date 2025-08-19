import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

console.log('API Key loaded in service:', apiKey ? 'Yes' : 'No');
console.log('API Key first 10 chars:', apiKey?.substring(0, 10));

if (!apiKey) {
  throw new Error('VITE_GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

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
type ResumeData = { experiences?: Experience[]; skills?: string[] };

const getSystemPrompt = (language: string, userContext: any, existingResumeData: ResumeData, conversationCount: number) => {
  const currentExperiences: Experience[] = existingResumeData?.experiences || [];
  const currentSkills: string[] = existingResumeData?.skills || [];

  const prompts: Record<string, string> = {
    en: `You are a resume building assistant. Respond in English.

Current resume has:
- ${currentExperiences.length} experiences: ${currentExperiences.map(e => e.company).join(', ')}
- Skills: ${currentSkills.join(', ')}

User: ${userContext?.fullName || 'User'} - ${userContext?.currentRole || 'No role'}

Rules:
1. If user mentions existing company (${currentExperiences.map(e => e.company).join(', ')}), UPDATE don't create new
2. Ask specific questions about work experience
3. Extract concrete info to update resume

Respond normally in conversation, then add structured data at the end in this EXACT format:

[RESUME_DATA]
{
  "action": "add" or "update" or "none",
  "experience": {
    "company": "Company Name",
    "title": "Job Title", 
    "duration": "2022-Present",
    "description": ["Achievement 1", "Achievement 2"]
  },
  "skills": ["new", "skills", "mentioned"]
}
[/RESUME_DATA]`,

    he: `אתה עוזר לבניית קורות חיים. ענה בעברית.

בקורות החיים הנוכחיים יש:
- ${currentExperiences.length} מקומות עבודה: ${currentExperiences.map(e => e.company).join(', ')}
- כישורים: ${currentSkills.join(', ')}

משתמש: ${userContext?.fullName || 'משתמש'} - ${userContext?.currentRole || 'ללא תפקיד'}

כללים:
1. אם המשתמש מזכיר חברה קיימת (${currentExperiences.map(e => e.company).join(', ')}), עדכן אל תיצור חדש
2. שאל שאלות ספציפיות על ניסיון עבודה
3. חלץ מידע קונקרטי לעדכון קורות החיים

ענה רגיל בשיחה, ואז הוסף מידע מובנה בסוף בפורמט המדויק הזה:

[RESUME_DATA]
{
  "action": "add" or "update" or "none",
  "experience": {
    "company": "שם החברה",
    "title": "תפקיד", 
    "duration": "2022-כיום",
    "description": ["הישג 1", "הישג 2"]
  },
  "skills": ["כישורים", "חדשים", "שהוזכרו"]
}
[/RESUME_DATA]`
  };

  return prompts[language] || prompts.en;
};

export const sendMessageToAI = async (message: string, userContext?: any, conversationCount: number = 0, existingResumeData?: any) => {
  try {
    console.log('Attempting API call with message:', message);
    
    const userLanguage = detectLanguage(message);
    console.log('Detected language:', userLanguage);
    
    const systemPrompt = getSystemPrompt(userLanguage, userContext, existingResumeData, conversationCount);
    
    const fullPrompt = `${systemPrompt}

User message: "${message}"

Important: Respond conversationally in ${userLanguage === 'he' ? 'Hebrew' : userLanguage === 'ar' ? 'Arabic' : 'English'}, then add the [RESUME_DATA] section if you extract any resume information.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    console.log('Full AI Response:', text);
    
    // Extract conversation message and resume data separately
    const resumeDataMatch = text.match(/\[RESUME_DATA\]([\s\S]*?)\[\/RESUME_DATA\]/);
    let conversationMessage = text;
    let resumeUpdates: { action?: string; [key: string]: any } = {};
    
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
      action: resumeUpdates?.action || 'none',
      resumeUpdates: resumeUpdates
    };
    
  } catch (error) {
    console.error('Full error details:', error);
    
    if (error instanceof Error) {
      return {
        message: `API Error: ${error.message}`,
        action: 'none',
        resumeUpdates: {}
      };
    }
    
    return {
      message: 'An unknown API error occurred.',
      action: 'none',
      resumeUpdates: {}
    };
  }
};