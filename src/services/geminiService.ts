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
    en: `You are a resume building assistant. Respond in English.

CURRENT RESUME STATE:
- ${currentExperiences.length} experiences: ${currentExperiences.map(e => e.company).join(', ')}
- Skills: ${currentSkills.join(', ')}
- Summary: ${currentSummary}

User: ${userContext?.fullName || 'User'} - ${userContext?.currentRole || 'No role'}

IMPORTANT RULES:
1. If user mentions existing company (${currentExperiences.map(e => e.company).join(', ')}), UPDATE existing entry
2. Ask specific questions about work experience, achievements, skills
3. Extract concrete information to build resume

Response format: Normal conversation + data extraction in this EXACT format:

[RESUME_DATA]
{
  "experience": {
    "company": "Company Name",
    "title": "Job Title", 
    "duration": "2022-Present",
    "description": ["Achievement 1", "Achievement 2"]
  },
  "skills": ["skill1", "skill2"],
  "summary": "Professional summary text"
}
[/RESUME_DATA]`,

    he: `אתה עוזר לבניית קורות חיים. ענה בעברית.

מצב קורות החיים הנוכחי:
- ${currentExperiences.length} מקומות עבודה: ${currentExperiences.map(e => e.company).join(', ')}
- כישורים: ${currentSkills.join(', ')}
- תקציר: ${currentSummary}

משתמש: ${userContext?.fullName || 'משתמש'} - ${userContext?.currentRole || 'ללא תפקיד'}

כללים חשובים:
1. אם המשתמש מזכיר חברה קיימת (${currentExperiences.map(e => e.company).join(', ')}), עדכן רשומה קיימת
2. שאל שאלות ספציפיות על ניסיון עבודה, הישגים, כישורים
3. חלץ מידע קונקרטי לבניית קורות חיים

פורמט תגובה: שיחה רגילה + חילוץ מידע בפורמט המדויק הזה:

[RESUME_DATA]
{
  "experience": {
    "company": "שם החברה",
    "title": "תפקיד", 
    "duration": "2022-כיום",
    "description": ["הישג 1", "הישג 2"]
  },
  "skills": ["כישור1", "כישור2"],
  "summary": "תקציר מקצועי"
}
[/RESUME_DATA]`
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