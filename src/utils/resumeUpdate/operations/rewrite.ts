import type { ResumeDataPatch } from '../../../lib/parseResumeData';

// Add missing type imports
type Resume = {
  experiences: any[];
  skills: string[];
  summary?: string;
  contact?: any;
};

type StoreActions = {
  addOrUpdateExperience: (e: any) => void;
  removeExperience: (company: string) => void;
  addSkills: (skills: string[]) => void;
  removeSkills: (skills: string[]) => void;
  setSummary: (s: string) => void;
  setContactInfo: (c: any) => void;
};

// Add missing utility functions
const norm = (s?: string) =>
  (s || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace('בע"מ', '')
    .replace('בעמ', '');

const sameCompany = (a?: string, b?: string) => {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
};

const findExp = (resume: Resume, company?: string) =>
  resume.experiences.find((e: any) => sameCompany(e.company, company));

export const handleRewrite = async (
  updates: ResumeDataPatch,
  currentResume: Resume,
  storeActions: StoreActions,
  addChatMessage: (m: string, t: 'ai' | 'user') => void
) => {
  if (updates.rewriteExperience) {
    const { company, title, duration, newDuration, newDescriptions, reason, newCompany } = updates.rewriteExperience;
    const exp = findExp(currentResume, company);

    if (exp) {
      const finalDuration = newDuration ?? duration ?? exp.duration;
      
      storeActions.addOrUpdateExperience({
        ...exp,
        ...(title && { title }),
        ...(newCompany && { company: newCompany }), // Add this line to handle company name changes
        duration: finalDuration,
        description: Array.isArray(newDescriptions) ? newDescriptions : exp.description,
      });
      
      const changes = [];
      if (newCompany && newCompany !== exp.company) changes.push(`שם החברה ל-${newCompany}`);
      if (title && title !== exp.title) changes.push(`תפקיד ל-${title}`);
      if (finalDuration !== exp.duration) changes.push('תאריכים');
      if (Array.isArray(newDescriptions)) changes.push('תיאורים');
      
      const changeText = changes.length > 0 ? ` - עדכנתי: ${changes.join(', ')}` : '';
      addChatMessage(`🔄 כתבתי מחדש את הניסיון בחברת ${newCompany || exp.company}${changeText}${reason ? ` (${reason})` : ''}`, 'ai');
    } else {
      addChatMessage(`⚠️ לא מצאתי ניסיון קיים ל-${company} עבור כתיבה מחדש.`, 'ai');
    }
  }
};
