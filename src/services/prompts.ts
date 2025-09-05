// Local lightweight type
type ExperienceLike = {
  id?: string;
  company?: string;
  title?: string;
  duration?: string;
  description?: string[];
};
type ResumeLike = {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  title?: string;
  summary?: string;
  experiences?: ExperienceLike[];
  skills?: string[];
};

// Build plain text resume context
const buildPlainTextResume = (resume: Partial<ResumeLike>): string => {
  const lines: string[] = [];

  if (resume.fullName || resume.title) {
    lines.push(`${resume.fullName || 'ללא שם'} ${resume.title ? '— ' + resume.title : ''}`.trim());
  }
  const contacts = [resume.email, resume.phone, resume.location].filter(Boolean);
  if (contacts.length) lines.push(`📞 ${contacts.join(' | ')}`);
  lines.push('');

  if (resume.summary) {
    lines.push('=== תקציר מקצועי ===', resume.summary, '');
  }

  if (resume.experiences?.length) {
    lines.push('=== ניסיון עבודה ===');
    resume.experiences.forEach((e, i) => {
      lines.push(`${i + 1}. 🏢 ${e.company || ''} - ${e.title || ''} ${e.duration ? `(${e.duration})` : ''}`);
      if (e.description?.length) {
        e.description.forEach((d, idx) => {
          const text = (d || '').toString();
          const wordCount = text.trim().split(/\s+/).length;
          const hints: string[] = [];
          if (/\d/.test(text)) hints.push('מספרים');
          if (/^(פיתחתי|ניהלתי|הובלתי|יצרתי|בניתי|תכננתי|עבדתי|אחראי|ביצעתי)/.test(text)) hints.push('פועל פעולה');
          if (wordCount > 15) hints.push('מפורט');
          lines.push(`   ${idx + 1}. ${text} ${hints.length ? `[${hints.join(', ')}]` : '[בסיסי]'}`);
        });
      } else {
        lines.push('   ❌ אין תיאורים');
      }
      lines.push('');
    });
  } else {
    lines.push('=== ניסיון עבודה ===', '❌ אין ניסיון', '');
  }

  if (resume.skills?.length) {
    lines.push('=== כישורים ===');
    lines.push(resume.skills.join(', '));
    lines.push(`📊 סה"כ: ${resume.skills.length} כישורים`, '');
  } else {
    lines.push('=== כישורים ===', '❌ אין כישורים', '');
  }

  return lines.join('\n');
};

export const getSystemPrompt = (
  language: string = 'he',
  userContext: any = {},
  currentResume: Partial<ResumeLike> = {},
  chatHistory: any[] = []
) => {
  const resumeContext = buildPlainTextResume(currentResume);

  // Extract target job posting if exists
  const targetJob = userContext?.targetJobPosting
    ? `משרת יעד:\n${userContext.targetJobPosting}\n`
    : '';

  return [
    '=== הנחיות כלליות ===',
    'אתה יועץ קריירה מומחה בעברית. מטרתך לשפר את קורות החיים תוך מניעת כפילויות.',
    '',
    'מצב נוכחי של קורות החיים:',
    resumeContext,
    '',
    targetJob,
    '=== כללים מרכזיים ===',
    '• עדכן במקום להוסיף אם המידע כבר קיים או חופף.',
    '• אל תוסיף כישורים כפולים או תיאורים גנריים.',
    '• הוסף רק מידע חדש, רלוונטי ומבוסס הישגים.',
    '• מחק תיאורים לא נכונים או חלשים לפי בקשת המשתמש.',
    '• תמיד השתמש בפורמט JSON בתוך תגיות [RESUME_DATA] כאשר יש עדכון.',
    '',
    '=== פעולות מותרות ===',
    '• experience – הוספת ניסיון חדש',
    '• rewriteExperience – כתיבה מחדש/עדכון ניסיון',
    '• removeExperiences – מחיקת ניסיון',
    '• removeDescriptionFromExperience – מחיקת שורה ספציפית',
    '• removeDescriptionsFromExperience – מחיקת כמה שורות',
    '• updateExperienceDescription – החלפת תיאורים',
    '• skills – הוספת כישורים חדשים',
    '• removeSkills – מחיקת כישורים',
    '',
    '=== דוגמאות JSON ===',
    'הוספת ניסיון חדש:',
    '[RESUME_DATA]{"experience":{"company":"חברה חדשה","title":"תפקיד","duration":"2020-2022","description":["ניהלתי צוות פיתוח"]}}[/RESUME_DATA]',
    '',
    'עדכון ניסיון קיים:',
    '[RESUME_DATA]{"rewriteExperience":{"company":"ישראכרט","newDescriptions":["פיתחתי אפליקציית מובייל ב-React Native"],"reason":"פרטים חדשים"}}[/RESUME_DATA]',
    '',
    'מחיקת כישור:',
    '[RESUME_DATA]{"removeSkills":["ניהול זמן"]}[/RESUME_DATA]',
    '',
    'מחיקת תיאור ספציפי:',
    '[RESUME_DATA]{"removeDescriptionFromExperience":{"company":"XYZ","descriptionToRemove":"עבדתי בצוות"}}[/RESUME_DATA]',
    '',
    '=== שימוש בזיכרון ===',
    `שפה: ${language}`,
    `קונטקסט: ${JSON.stringify({ ...userContext, targetJobPosting: userContext.targetJobPosting }, null, 2)}`,
    `היסטוריית שיחה: ${JSON.stringify(chatHistory, null, 2)}`,
    `קורות חיים בזמן אמת (אובייקט מובנה): ${JSON.stringify(currentResume, null, 2)}`,
    'השתמש בזה כדי לייצר תגובות רלוונטיות.',
    '',
    '=== הנחיה לסיום ===',
    'בכל תשובה שלך סיים תמיד בשאלה מכווינה שעשויה לעזור למשתמש להביא מידע רלוונטי שקשה לו להוציא בעצמו שיעזור לו להבליט את קורות החיים:',
   
    ];
  
  };