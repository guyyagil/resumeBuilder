// Basic Gemini service for compatibility
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAppStore } from '../store/useAppStore';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function sendMessageToAI(message: string): Promise<{ message: string; resumeUpdates?: any }> {
  try {
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return {
      message: text,
      resumeUpdates: null // For now, no resume updates
    };
  } catch (error) {
    console.error('AI service error:', error);
    return {
      message: 'מצטער, הייתה בעיה בתקשורת עם השירות. נסה שוב.',
      resumeUpdates: null
    };
  }
}

export async function extractResumeFromPlainText(text: string): Promise<any> {
  try {
    console.log('🔍 Starting AI-powered resume extraction...');
    console.log('📄 Resume text length:', text.length, 'characters');

    // Create AI prompt for resume parsing
    const prompt = `
אתה מנתח קורות חיים מומחה. תפקידך לנתח את טקסט קורות החיים הבא ולחלץ ממנו מידע מובנה.

חשוב: תמיד שמור על טקסט עברי בדיוק כפי שהוא מופיע. אל תשנה תווים עבריים.

צור מקטעים (sections) בהתאם למה שאתה מוצא בטקסט:
- contact: פרטי התקשרות (שם, אימייל, טלפון, כתובת)
- summary: תקציר מקצועי (אם קיים)
- experience: ניסיון עבודה
- education: השכלה
- skills: כישורים
- military: שירות צבאי (אם קיים)
- projects: פרויקטים (אם קיים)
- certifications: הסמכות (אם קיים)

פורמט הפלט חייב להיות JSON עם המבנה הבא:
{
  "sections": [
    {
      "key": "contact",
      "title": "פרטי התקשרות",
      "layout": "keyValue",
      "pairs": [
        {"key": "fullName", "value": "שם מלא"},
        {"key": "email", "value": "email@example.com"},
        {"key": "phone", "value": "טלפון"}
      ]
    },
    {
      "key": "experience", 
      "title": "ניסיון מקצועי",
      "layout": "list",
      "items": [
        {
          "title": "תפקיד",
          "company": "חברה",
          "duration": "תקופה",
          "description": "תיאור התפקיד"
        }
      ]
    }
  ]
}

טקסט קורות החיים לניתוח:
=====================================
${text}
=====================================

תן רק את ה-JSON, ללא הסברים נוספים.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();

    console.log('🤖 AI Response:', aiText);

    // Extract JSON from AI response
    let jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    console.log('📊 Parsed sections:', parsedData);

    // Apply sections to store
    const store = useAppStore.getState();

    if (parsedData.sections && Array.isArray(parsedData.sections)) {
      // Clear existing sections first
      store.replaceSections([]);

      // Add each section
      for (const section of parsedData.sections) {
        console.log('➕ Adding section:', section.key);
        store.upsertSection(section);
      }

      console.log('✅ All sections added to store');

      return {
        ok: true,
        patch: { operations: [] }, // Required by WelcomeForm
        message: 'קורות החיים עובדו בהצלחה'
      };
    } else {
      throw new Error('Invalid sections format from AI');
    }

  } catch (error) {
    console.error('❌ Error extracting resume:', error);

    // Fallback: create basic sections with simple parsing
    const store = useAppStore.getState();

    // Simple fallback parsing
    const lines = text.split('\n').filter(line => line.trim());
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const phoneMatch = text.match(/(\+?[\d\s\-\(\)]{7,15})/);

    // Create basic contact section
    store.upsertSection({
      key: 'contact',
      title: 'פרטי התקשרות',
      layout: 'keyValue',
      pairs: [
        { key: 'fullName', value: lines[0] || 'שם לא זוהה' },
        ...(emailMatch ? [{ key: 'email', value: emailMatch[1] }] : []),
        ...(phoneMatch ? [{ key: 'phone', value: phoneMatch[1] }] : [])
      ]
    });

    // Create basic summary
    store.upsertSection({
      key: 'summary',
      title: 'תקציר מקצועי',
      layout: 'text',
      text: 'תקציר יופק על בסיס המידע שסופק'
    });

    return {
      ok: true,
      patch: { operations: [] },
      message: 'קורות החיים עובדו בהצלחה (מצב חירום)'
    };
  }
}