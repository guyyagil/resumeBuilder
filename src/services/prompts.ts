import type { Resume } from '../types';

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

export const getSystemPrompt = (
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
    '{CURRENT_SKILLS}:',
    '------------------',
    (currentSkills.length ? currentSkills.join(", ") : '(אין כישורים רשומים)'),
    '',
    '{TARGET_JOB}:',
    '------------------',
    targetJobPosting || '(לא סופק טקסט משרה)',
    '',
    'הנחיות התאמה:',
    '- זיהוי כישורים: היעד שלך הוא גם לחלץ כישורי טכנולוגיה (באנגלית) וגם כישורי רכות/ניהול (בשפה המקורית, לרוב עברית).',
    '- תמיד כלול שדה מיוחד של כישורים במידה והוספת או זיהית כישורים חדשים: "skills" (טכנולוגיות באנגלית) ו/או "CURRENT_SKILLS" (רשימת כישורי רכות/soft skills בשפה טבעית).',
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
    '- השלמת תיאורים חסרים: אם ניסיון תעסוקתי קיים מופיע ללא תיאור, חובה ליצור עבורו תיאור בן 1-2 משפטים על סמך שם התפקיד. אל תשאיר חוויות עבודה ללא תיאור.',
    '- description: חובה מערך של 1-5 משפטים מלאים בעברית. כל משפט חייב לתאר אחריות או הישג. כל משפט חייב להתחיל בפועל עבר ("פיתחתי", "הובלתי", "ניהלתי") ולהסתיים בנקודה.',
    '- דוגמה רעה ל-description (אסור): ["ניהול", "עבודת צוות", "אסרטיביות"]. זה לא תיאור תפקיד!',
    '- דוגמה טובה ל-description (כך צריך): ["ניהלתי צוות של 5 מפתחים בפרויקט X.", "הובלתי תהליך אפיון ופיתוח של מערכת Y מתחילתה ועד סופה."]',
    '- אסור לשים רק מילות מפתח או רשימות נקודות בודדות ב-description.',
    '- אסור לכלול תיאורים באנגלית כמו "Add measurable accomplishment", "Key responsibility", "Add measurable" - רק תוכן עברי איכותי.',
    '- אם אין מידע מספיק, העדף לא לכלול description כלל במקום להשתמש בטקסט באנגלית.',
    '- summary: חובה ליצור תקציר מקצועי עשיר ומפורט בעברית (3-4 שורות). התקציר צריך לשלב את שנות הניסיון, התפקיד הנוכחי, תכונות אופי בולטות (כמו "מוטיבציה גבוהה", "יכולת הנעה עצמית") וכישורים מרכזיים מהרזומה. זהו החלק החשוב ביותר להצגת המועמד.',
    '- תמיד כלול summary מעודכן בהתאם להקשר השיחה ולמשרת היעד.',
    '- skills: רק טכנולוגיות באנגלית כמו React, Node.js, Python (מערך נפרד).',
    '- זהה וחלץ כישורים מהשיחה: אם המשתמש מזכיר טכנולוגיות/כלים/שפות תכנות - הוסף אותם ל-skills.',
    '- אם המשתמש מתאר עבודה עם כלי מסוים - חלץ את שם הכלי ל-skills.',
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

  // Reference them so TypeScript doesn't flag them as unused:
  void language;
  void currentExperiences;
  void currentSummary;

  return [
    baseHebrewLines.join('\n'),
    conversationMemory,
    translationRuleLines.join('\n'),
    rulesLines.join('\n')
  ].filter(Boolean).join('\n\n');
};