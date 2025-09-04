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
  const currentSkills: string[] = resume?.skills || [];
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
    'אתה מדריך לשיפור קורות חיים.',
    'מטרה: לשפר בהדרגה את הקיים כך שיותאם למשרת היעד.',
    '',
    '{CURRENT_CV_TEXT}:',
    '------------------',
    plainTextCV || '(קורות חיים ריקים)',
    '',
    '{CURRENT_SKILLS}:',
    '------------------',
    (currentSkills.length ? currentSkills.join(', ') : '(אין כישורים רשומים)'),
    '',
    '{TARGET_JOB}:',
    '------------------',
    targetJobPosting || '(לא סופק טקסט משרה)',
    '',
    'התאמה והדגשים:',
    '- חלץ גם טכנולוגיות (באנגלית) וגם כישורי רכות/ניהול (בשפת המקור).',
    '- אם נוספו/זוהו כישורים: החזר "skills" (טכנולוגיות באנגלית) ו/או "CURRENT_SKILLS" (כישורי רכות טבעיים).',
    '- שפר ניסוח, הדגש תוצאות מדידות ודיוק מינוח; שמור שמות טכנולוגיות/חברות באנגלית.',
    '- אין להמציא חברות/טכנולוגיות; אל תשנה תאריכים ללא הצדקה.',
    '- בצע שינויים מדורגים; החזר רק מה שבאמת עודכן.',
    '- תמיד בלוק [RESUME_DATA] אחד בלבד.',
    '- אם חסר מידע קריטי: שאל שאלה אחת בלבד.',
    '',
    'אותנטיות:',
    '- אין לנסח רצון מעבר תחום/חיפוש הזדמנות.',
    '- השתמש במשרת היעד רק להבנת ההדגשים.'
  ];

  const rulesLines = [
    'כללי תגובה:',
    '- עד 6 שורות טקסט הסבר לפני בלוק הנתונים. תמיד [RESUME_DATA] אחד.',
    '- אין Markdown או תבליטים בחלק ההסבר: ללא **מודגש**, *, _, #, או רשימות. כתוב כפסקאות קצרות בלבד.',
    '- התגובה למשתמש חייבת להיות קצרה, ממוקדת וברורה (עד 2–3 משפטים לכל היותר).',
    '- כל תשובה תכלול עדכון קצר: מה שונה/הוסף/הוסר ברזומה.',
    '- תמיד לסיים בשאלה אחת שמכוונת את המשתמש להוסיף מידע רלוונטי או להבהיר צורך.',
    '- החזר רק שדות שעודכנו (patch) או מבנה מלא (replace). פורמט חובה: [RESUME_DATA] JSON [/RESUME_DATA] ללא backticks/המילה json.',
    '- השלמת תיאורים חסרים: אם לניסיון אין תיאור—צור 1–2 משפטים לפי שם התפקיד; אין להשאיר ריק.',
    '- description: מערך של 1–5 משפטים מלאים בעברית. כל משפט מתאר אחריות/הישג קונקרטי, מתחיל בפועל עבר ("פיתחתי", "הובלתי", "ניהלתי") ומסתיים בנקודה.',
    '- דוגמה רעה ל-description (אסור): ["ניהול", "עבודת צוות", "אסרטיביות"]. זה לא תיאור תפקיד!',
    '- דוגמה טובה ל-description (כך צריך): ["ניהלתי צוות של 5 מפתחים בפרויקט X.", "הובלתי תהליך אפיון ופיתוח של מערכת Y מתחילתה ועד סופה."]',
    '- אין רשימות מילות מפתח/טכנולוגיות בתיאור התפקיד. אם משפט הוא רשימת כלים—העבר את הכלים ל-skills והחלף במשפט תוצאתי.',
    '- אין טקסט גנרי באנגלית ("Add measurable accomplishment", "Key responsibility", "Add measurable", "יש להוסיף תיאור תפקיד").',
    '- ללא כפילויות: משפטים חייבים להיות ייחודיים, לא לחזור על אותה פעולה/מידע בניסוח אחר. גוון פעלים; הימנע מחזרה על אותה פתיח.',
    '- אין להוסיף פריטים שכבר קיימים במצב הנוכחי: אל תשכפל חוויות/משפטים/skills שמופיעים ב-{CURRENT_CV_TEXT} או ברשימת הכישורים.',
    '- ניסיון: אם קיימת חפיפה לפי company + title, בצע עדכון של הרשומה הקיימת במקום להוסיף חדשה.',
    '- skills: הימנע מכפילויות (case-insensitive). נרמל ורק אז הוסף כישורים חדשים שאינם קיימים.',
    '- summary: אל תחזור על משפטים שכבר קיימים; עדכן או שפר ניסוח במקום לשכפל.',
    '- אם חסר מידע, הפק תיאור סביר לפי שם התפקיד/החברה (למשל לנציג מכירות: "ביצעתי מכירות פרונטליות והענקתי שירות לקוחות.").',
    '- summary: חובה להחזיר תקציר מקצועי עשיר ומפורט בעברית (לפחות 3–4 שורות מלאות) בכל עדכון, גם אם לא סופק תקציר קודם. התקציר יכלול שנות ניסיון, תפקיד נוכחי/בכיר, תכונות אופי בולטות וכישורים מרכזיים. אין להחזיר נוסח גנרי או באנגלית ("Professional individual ready to contribute").',
    '- תמיד כלול summary חדש או מעודכן בהתאם להקשר השיחה ולמשרת היעד.',
    '- skills: רק טכנולוגיות באנגלית (React, Node.js, Python...).',
    '- חובה לחלץ ולהוסיף כישורים מכל המקורות: CURRENT_CV_TEXT, תיאורי ניסיון, TARGET_JOB, וזיכרון השיחה. כל כלי/טכנולוגיה שמוזכרים—נכנסים ל-skills; ללא כפילויות.',
    '- כל התיאורים/summary בעברית (טכנולוגיות נשארות באנגלית).',
    '- אין מספרים מדויקים מומצאים.',
    '- סיים תמיד את חלק ההסבר לפני בלוק הנתונים בשאלה מדריכה אחת שמקדמת את השיחה.'
  ];

  const translationRuleLines = [
    'הוראות שפה:',
    '- כתיבה בעברית תקנית.',
    '- אין לתרגם שמות חברות/טכנולוגיות.',
    '- אם הקלט באנגלית: תרגם לעברית פרט לשמות proper-nouns.'
  ];

  // Reference to avoid TS "unused" warnings:
  void language;

  return [
    baseHebrewLines.join('\n'),
    conversationMemory,
    translationRuleLines.join('\n'),
    rulesLines.join('\n')
  ].filter(Boolean).join('\n\n');
};

