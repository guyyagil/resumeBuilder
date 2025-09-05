import type { Resume } from '../types';

const buildPlainTextResume = (resume: any): string => {
  const lines: string[] = [];
  
  // Header with contact info
  if (resume.fullName || resume.title) {
    lines.push(`${resume.fullName || 'ללא שם'} ${resume.title ? '— ' + resume.title : ''}`.trim());
  }
  if (resume.email || resume.phone || resume.location) {
    const contactParts = [resume.email, resume.phone, resume.location].filter(Boolean);
    if (contactParts.length > 0) {
      lines.push(`📞 ${contactParts.join(' | ')}`);
    }
  }
  lines.push(''); // Empty line
  
  // Summary
  if (resume.summary) {
    lines.push('=== תקציר מקצועי נוכחי ===');
    lines.push(resume.summary);
    lines.push('');
  }
  
  // Experiences with full detail
  if (resume.experiences?.length) {
    lines.push('=== ניסיון עבודה במערכת כרגע ===');
    resume.experiences.forEach((e: any, i: number) => {
      lines.push(`${i + 1}. 🏢 ${e.company || ''} - ${e.title || ''} ${e.duration ? `(${e.duration})` : ''}`);
      if (e.description && e.description.length > 0) {
        lines.push('   תיאורים רשומים:');
        e.description.forEach((d: string, idx: number) => {
          lines.push(`   ${idx + 1}. ${d}`);
        });
      } else {
        lines.push('   (אין תיאורים)');
      }
      lines.push(''); // Empty line between experiences
    });
  } else {
    lines.push('=== ניסיון עבודה ===');
    lines.push('(עדיין לא נוסף ניסיון עבודה)');
    lines.push('');
  }
  
  // Skills
  if (resume.skills?.length) {
    lines.push('=== כישורים רשומים ===');
    lines.push(resume.skills.join(', '));
    lines.push('');
  } else {
    lines.push('=== כישורים ===');
    lines.push('(עדיין לא נוספו כישורים)');
    lines.push('');
  }
  
  return lines.join('\n');
};

export const getSystemPrompt = (
  language: string,
  userContext: any,
  resume: Resume,
  chatMessages?: any[]
) => {
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
    'אתה מדריך לשיפור קורות חיים מקצועי ואתה אחראי מלא על החלטות.',
    'משימתך: לשפר ולעדכן קורות חיים בצורה חכמה ומושכלת.',
    '',
    '🎯 אחריות מלאה: אתה רואה את המצב הנוכחי המלא למטה.',
    '🧠 החלט בעצמך: מה לעדכן, מה להוסיף, ומה לא לגעת בו.',
    '💡 היגיון: אם משהו כבר קיים ודומה - אל תוסיף. אם חדש - הוסף.',
    '',
    '{מצב קורות החיים הנוכחי - קרא בעיון}:',
    '==================================================',
    plainTextCV || '(קורות חיים ריקים לחלוטין)',
    '==================================================',
    '',
    '{משרת יעד}:',
    targetJobPosting || '(לא הוגדרה משרת יעד)',
    '',
    '=== אחריות והחלטות ===',
    'אתה רואה הכל למעלה. השתמש בשיקול דעת:',
    '• אם תיאור דומה קיים - אל תוסיף עוד אחד דומה',
    '• אם כישור כבר ברשימה - אל תוסיף אותו שוב',
    '• אם מידע חדש ושונה - הוסף אותו',
    '• אם יש שיפור למידע קיים - עדכן אותו',
    '',
    '=== כללים טכניים ===',
    'תקציר: עדכן רק אם יש מידע חדש או שיפור משמעותי',
    'ניסיון: הוסף רק חוויות חדשות או תיאורים שונים באמת',
    'כישורים: הוסף רק כישורים שלא מופיעים כבר',
    'איכות: משפטים מלאים בעברית עם פעלים בעבר'
  ];

  const structureRules = [
    '=== מבנה תגובה ===',
    '1. הסבר קצר: מה החלטת לעשות ולמה',
    '2. [RESUME_DATA] עם JSON [/RESUME_DATA]',
    '3. שאלה להמשך השיחה',
    '',
    '=== פורמט JSON ===',
    'כלול רק שדות שאתה באמת רוצה לעדכן:',
    '"summary": "רק אם יש שיפור או מידע חדש"',
    '"contact": פרטי קשר מעודכנים',
    '"experiences": [רק חוויות חדשות או משופרות]',
    '"skills": [רק כישורים חדשים]',
    '',
    '=== דוגמת תגובה ===',
    'הוספתי את הניסיון החדש ב-[חברה] כי לא היה קיים.',
    'לא הוספתי [כישור X] כי הוא כבר ברשימה.',
    '',
    '[RESUME_DATA]',
    '{ "experiences": [...] }',
    '[/RESUME_DATA]',
    '',
    'איזה פרטים נוספים תרצה לשתף?'
  ];

  const qualityRules = [
    '=== איכות תוכן ===',
    'תיאורי תפקידים: התחל בפועל עבר ("פיתחתי", "ניהלתי", "הובלתי")',
    'הישגים: כלול מספרים ותוצאות כשאפשר',
    'כישורים: בעברית, אלא אם זה שם טכנולוgiה',
    'תקציר: 2-3 שורות עם שנות ניסיון, תחומי מומחיות, וכישורים מרכזיים',
    '',
    'אסור: תיאורים גנריים, רשימות טכנולוגיות בתיאורים, כפילויות'
  ];

  // Reference to avoid TS "unused" warnings:
  void language;

  return [
    baseHebrewLines.join('\n'),
    conversationMemory,
    structureRules.join('\n'),
    qualityRules.join('\n')
  ].filter(Boolean).join('\n\n');
};

