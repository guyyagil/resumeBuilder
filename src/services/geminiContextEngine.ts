import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('VITE_GEMINI_API_KEY is not set in environment variables for context engine');
}

const genAI = new GoogleGenerativeAI(apiKey);
// Use a model optimized for summarization and structured data extraction
const summaryModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface StructuredSummary {
  userIntent: string;
  keyEntities: {
    companies: string[];
    skills: string[];
    universities: string[];
    roles: string[];
  };
  contextSummary: string;

  // Recent messages (kept for quick reference)
  recentMessages: { sender: 'user' | 'ai'; text: string }[];

  // Analyze resume experiences for missing fields and report per-experience completeness
  missingFields: {
    experiences: Array<{
      company?: boolean; // true if present
      title?: boolean;
      duration?: boolean;
      description?: boolean; // at least one bullet
      identifier?: string; // helpful id (company or index)
    }>;
    skillsMissing?: string[];
    summaryMissing?: boolean;
  };

  // Prioritized follow-up questions the main model should ask the user to gather missing details
  nextQuestions: string[];

  // Whether it is safe to create resume entries now (true = there is at least one complete experience)
  canCreateEntries: boolean;

  // Questions the assistant asked the user (so the main model knows what's already been requested)
  assistantQuestions?: string[];

  // Questions the user asked (if any) — useful to detect clarifications or self-questions
  userQuestions?: string[];
}

// Define Resume and Experience types to be used in the function
type Experience = { company?: string; title?: string; duration?: string; description?: string[] };
type Resume = { experiences?: Experience[]; skills?: string[]; summary?: string };

// Simple helper to detect if a text looks like a question
const looksLikeQuestion = (text: string) => {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.endsWith('?')) return true;
  // common interrogative starts
  const interrogatives = ['what', 'when', 'where', 'why', 'how', 'which', 'who', 'did', 'do', 'does', 'is', 'are', 'can', 'could', 'would'];
  const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
  return interrogatives.includes(firstWord);
}

// Conversation summarization function
export const summarizeConversation = async (
  messages: any[],
  resume: Resume,
  language: string
): Promise<StructuredSummary | null> => {
  if (!messages || messages.length <= 1) {
    return null;
  }

  // We will analyze the last 10 messages for immediate context
  const recentMessages = messages.slice(-10);
  const conversationText = recentMessages
    .map(msg => `${msg.type === 'user' ? 'User' : 'AI'}: ${msg.content}`)
    .join('\n');

  // Build a compact representation of resume experiences for the summarizer
  const resumeEntriesText = (resume?.experiences || []).map((e, idx) => {
    const title = e.title || '';
    const comp = e.company || '';
    const dur = e.duration || '';
    const desc = (e.description || []).slice(0, 3).join('; ');
    return `Entry ${idx + 1}: company='${comp}', title='${title}', duration='${dur}', description='${desc}'`;
  }).join('\n') || 'No experiences';

  const resumeState = `Resume Summary:\n- Summary: ${resume.summary || 'Not set'}\n- Experiences:\n${resumeEntriesText}\n- Skills: ${(resume.skills || []).join(', ') || 'None'}`;

  // Prompt instructing the summarizer to produce a richer JSON structure
  const summaryPrompt = language === 'he'
    ? `אנא נתח את השיחה האחרונה (עד 10 ההודעות האחרונות) ביחד עם מצב קורות החיים שניתן. חלץ מידע מובנה ועשה את הדברים הבאים:

1) זהה כוונת המשתמש (לדוגמה: add_experience, update_skills, provide_dates).
2) זיהוי ישויות מפתח (חברות, כישורים, אוניברסיטאות, תפקידים).
3) עבור כל רשומת ניסיון בקורות החיים, בדוק אילו שדות קיימים: company, title, duration, description. ציין עבור כל שדה האם הוא נוכח.
4) ספק שאלות המשך מסודרות ועדיפות (קצרות), שמטרתן לאסוף שדות חסרים. עדיף שאלות ספציפיות כמו: "What was your title at Harvard?" או בעברית: "מה התפקיד שלך ב‑Harvard?".
5) רשום גם את השאלות שהעוזר (AI) כבר שאל במהלך השיחה (assistantQuestions) ואת השאלות שהמשתמש שאל (userQuestions) כדי שלא נשאל אותם שוב.
6) קבע האם ניתן ליצור רשומות קורות חיים כעת (canCreateEntries) - רק אם קיימת לפחות רשומה אחת עם company+title+description.
7) החזר JSON בלבד עם השדות: userIntent, keyEntities, contextSummary, recentMessages (array), missingFields, nextQuestions (array), assistantQuestions, userQuestions, canCreateEntries.

מצב קורות חיים:\n${resumeState}

שיחה אחרונה:\n${conversationText}`
    : `Please analyze the recent conversation (up to 10 last messages) together with the provided resume state. Extract structured information and perform the following:

1) Identify the user's intent (e.g., add_experience, update_skills, provide_dates).
2) Extract key entities (companies, skills, universities, roles).
3) For each resume experience provided, check which fields are present: company, title, duration, description. Mark presence for each.
4) Provide prioritized, concise follow-up questions that the assistant should ask to collect any missing fields. Prefer specific prompts like: "What was your title at Harvard?".
5) Also list the questions the assistant already asked (assistantQuestions) and the questions the user asked (userQuestions) so the main model doesn't repeat them.
6) Decide whether it's safe to create resume entries now (canCreateEntries) — only true if there is at least one experience with company + title + description.
7) Return JSON ONLY with these fields: userIntent, keyEntities, contextSummary, recentMessages (array), missingFields, nextQuestions (array), assistantQuestions, userQuestions, canCreateEntries.

Resume State:\n${resumeState}

Recent Conversation:\n${conversationText}`;

  try {
    const result = await summaryModel.generateContent(summaryPrompt);
    const response = await result.response;
    const rawText = response.text().trim();
    const jsonText = rawText
      .replace(/```json|```/g, '')
      .replace(/^[^\{]*\{/, '{') // attempt to trim leading commentary before JSON
      .replace(/\}[^\}]*$/,'}'); // attempt to trim trailing commentary after JSON

    const summary: StructuredSummary = JSON.parse(jsonText);

    // Sanity-check and fill defaults if needed
    summary.recentMessages = summary.recentMessages || recentMessages.map(m => ({ sender: m.type === 'user' ? 'user' : 'ai', text: m.content }));
    summary.keyEntities = summary.keyEntities || { companies: [], skills: [], universities: [], roles: [] };
    summary.missingFields = summary.missingFields || { experiences: [] };
    summary.nextQuestions = summary.nextQuestions || [];
    summary.contextSummary = summary.contextSummary || '';
    summary.canCreateEntries = !!summary.canCreateEntries;

    // If the LLM didn't provide assistantQuestions/userQuestions, compute them locally as fallback
    const assistantQs = summary.assistantQuestions || recentMessages.filter(m => m.type === 'ai' && looksLikeQuestion(m.content)).map(m => m.content);
    const userQs = summary.userQuestions || recentMessages.filter(m => m.type === 'user' && looksLikeQuestion(m.content)).map(m => m.content);

    summary.assistantQuestions = assistantQs;
    summary.userQuestions = userQs;

    return summary;
  } catch (error) {
    console.error('Error generating structured summary:', error);
    return null;
  }
};
