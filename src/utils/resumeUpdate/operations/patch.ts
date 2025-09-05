// patch.ts — simplified & extensible (no static pattern casting)

import type { ResumeDataPatch } from '../../../lib/parseResumeData';

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

type Helpers = {
  // Optional hooks (provide only if you want custom behavior)
  filterEnglishDescriptions?: (d: string[]) => string[];
  isDuplicateContent?: (n: any, e: any[]) => boolean;
  hasQualityContent?: (e: any) => boolean;
  isPlaceholderContact?: (c: any) => boolean;

  // NEW: optional dynamic skill extractor (e.g., call your AI layer)
  // Return a list of skills inferred from context, without duplicates.
  extractSkills?: (ctx: {
    descriptions: string[];
    experience?: any;
    updates?: ResumeDataPatch;
    resume?: Resume;
  }) => string[];
};

// ---------- Utilities ----------
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

const toArray = (v: string | string[] | undefined | null) =>
  Array.isArray(v) ? v : (typeof v === 'string' && v.trim() ? [v] : []);

const uniqLower = (arr: string[]) => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const k = s.toLowerCase().trim();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(s);
    }
  }
  return out;
};

const filterDesc = (helpers: Helpers, desc: string[]) =>
  (helpers.filterEnglishDescriptions || ((d: string[]) => d))(desc);

const mergeDescriptions = (existing: string[] = [], incoming: string[] = []) => {
  const existingSet = new Set(existing.map((d) => d.toLowerCase().trim()));
  const newOnes = incoming.filter((d) => !existingSet.has(d.toLowerCase().trim()));
  return [...existing, ...newOnes];
};



// Call optional dynamic skill extractor safely
const inferSkills = (
  helpers: Helpers,
  ctx: { descriptions: string[]; experience?: any; updates?: ResumeDataPatch; resume?: Resume }
): string[] => {
  if (!helpers?.extractSkills) return [];
  const out = helpers.extractSkills(ctx) || [];
  const seen = new Set<string>();
  return out
    .map((s) => (s || '').trim())
    .filter((s) => {
      const k = s.toLowerCase();
      if (!k) return false;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
};

// ---------- Core handler ----------
export const handlePatch = async (
  updates: ResumeDataPatch,
  currentResume: Resume,
  storeActions: StoreActions,
  addChatMessage: (m: string, t: 'ai' | 'user') => void,
  helpers: Helpers
) => {
  // --- rewriteExperience ---
  if (updates.rewriteExperience) {
    const { company, title, duration, newDuration, newDescriptions, reason } = updates.rewriteExperience;
    const exp = findExp(currentResume, company);

    if (exp) {
      const finalDuration = newDuration ?? duration ?? exp.duration;
      storeActions.addOrUpdateExperience({
        ...exp,
        ...(title && { title }),
        duration: finalDuration,
        description: Array.isArray(newDescriptions) ? newDescriptions : exp.description,
      });
      addChatMessage(`🔄 כתבתי מחדש את הניסיון בחברת ${exp.company}${reason ? ` (${reason})` : ''}`, 'ai');
    } else {
      addChatMessage(`⚠️ לא מצאתי ניסיון קיים ל-${company} עבור כתיבה מחדש.`, 'ai');
    }
  }

  // --- updateExperienceDescription ---
  if (updates.updateExperienceDescription) {
    const { company, newDescriptions, replaceAll } = updates.updateExperienceDescription;
    const exp = findExp(currentResume, company);
    if (exp) {
      const filtered = filterDesc(helpers, toArray(newDescriptions));
      const description = replaceAll ? filtered : mergeDescriptions(exp.description, filtered);
      storeActions.addOrUpdateExperience({ ...exp, description: uniqLower(description) });
      addChatMessage(`✅ ${replaceAll ? 'החלפתי' : 'הוספתי'} תיאורים בחברת ${exp.company}`, 'ai');
    } else {
      addChatMessage(`⚠️ לא מצאתי חברת ${company} לעדכון`, 'ai');
    }
  }

  // --- removeDescriptionFromExperience ---
  if (updates.removeDescriptionFromExperience) {
    const { company, descriptionToRemove } = updates.removeDescriptionFromExperience;
    const exp = findExp(currentResume, company);
    if (exp && exp.description?.length) {
      const target = (descriptionToRemove || '').toLowerCase().trim();
      const next = exp.description.filter((d: string) => d.toLowerCase().trim() !== target);
      storeActions.addOrUpdateExperience({ ...exp, description: next });
      addChatMessage(`🗑️ מחקתי תיאור ספציפי מחברת ${exp.company}`, 'ai');
    } else {
      addChatMessage(`⚠️ לא נמצאו תיאורים למחיקה ב-${company}`, 'ai');
    }
  }

  // --- removeDescriptionsFromExperience ---
  if (updates.removeDescriptionsFromExperience) {
    const { company, descriptionsToRemove } = updates.removeDescriptionsFromExperience;
    const exp = findExp(currentResume, company);
    if (exp && Array.isArray(exp.description) && Array.isArray(descriptionsToRemove)) {
      const targets = new Set(
        descriptionsToRemove.map((d: string) => (d || '').toLowerCase().trim()).filter(Boolean)
      );
      const next = exp.description.filter((d: string) => !targets.has((d || '').toLowerCase().trim()));
      storeActions.addOrUpdateExperience({ ...exp, description: next });
      addChatMessage(`🗑️ מחקתי ${targets.size} תיאורים מחברת ${exp.company}`, 'ai');
    } else {
      addChatMessage(`⚠️ לא הצלחתי למחוק תיאורים עבור ${company}`, 'ai');
    }
  }

  // --- removals: experiences & skills (plus single aliases) ---
  if (Array.isArray(updates.removeExperiences) && updates.removeExperiences.length) {
    updates.removeExperiences.forEach((c) => storeActions.removeExperience(c));
    addChatMessage(`🗑️ הסרתי ניסיון עבודה: ${updates.removeExperiences.join(', ')}`, 'ai');
  }
  if (updates.deleteCompany) {
    storeActions.removeExperience(updates.deleteCompany);
    addChatMessage(`🗑️ מחקתי את הניסיון בחברת ${updates.deleteCompany}`, 'ai');
  }
  if (Array.isArray(updates.removeSkills) && updates.removeSkills.length) {
    storeActions.removeSkills(updates.removeSkills);
    addChatMessage(`🗑️ הסרתי כישורים: ${updates.removeSkills.join(', ')}`, 'ai');
  }
  if (updates.deleteSkill) {
    storeActions.removeSkills([updates.deleteSkill]);
    addChatMessage(`🗑️ מחקתי את הכישור: ${updates.deleteSkill}`, 'ai');
  }

  // --- replaceExperience (preserve id if exists) ---
  if (updates.replaceExperience) {
    const { company, newExperience } = updates.replaceExperience;
    const existing = findExp(currentResume, company);
    if (newExperience?.company && newExperience?.title) {
      const id = existing?.id || newExperience.id || `${newExperience.company}-${newExperience.title}`;
      storeActions.addOrUpdateExperience({
        id,
        company: newExperience.company,
        title: newExperience.title,
        duration: newExperience.duration,
        description: toArray(newExperience.description)
      });
      addChatMessage(`🔄 החלפתי את הניסיון בחברת ${company} עם ${newExperience.company}`, 'ai');
    } else {
      storeActions.removeExperience(company);
      addChatMessage(`🗑️ מחקתי את הניסיון בחברת ${company}`, 'ai');
    }
  }

  // --- experience: add or merge-on-duplicate ---
  if (updates.experience) {
    const exp = updates.experience;
    const validCompany = !!(exp.company && exp.company.trim() && exp.company !== 'Company Name');
    const validTitle = !!(exp.title && exp.title.trim() && exp.title !== 'Job Title');

    if (!validCompany || !validTitle) {
      addChatMessage('⚠️ לא הצלחתי להוסיף את הניסיון - חסרים פרטים בסיסיים.', 'ai');
    } else {
      const existing = currentResume.experiences.find(
        (e) =>
          e.company?.toLowerCase().trim() === exp.company?.toLowerCase().trim() &&
          e.title?.toLowerCase().trim() === exp.title?.toLowerCase().trim()
      );

      const baseDesc = filterDesc(helpers, toArray(exp.description));
      if (existing) {
        const description = mergeDescriptions(existing.description, baseDesc);
        const updated = {
          ...existing,
          duration: exp.duration || existing.duration,
          description
        };
        storeActions.addOrUpdateExperience(updated);

        const parts: string[] = [];
        if (exp.duration && exp.duration !== existing.duration) parts.push('תאריכים');
        const newCount = description.length - (existing.description?.length || 0);
        if (newCount > 0) parts.push(`${newCount} תיאורים חדשים`);

        addChatMessage(
          parts.length
            ? `✅ עדכנתי את הניסיון בחברת ${exp.company} עם ${parts.join(' ו')}.`
            : `💭 הניסיון בחברת ${exp.company} כבר קיים עם אותם פרטים.`,
          'ai'
        );
      } else {
        let description = baseDesc;
        if (description.length === 0) {
          description = [`עבדתי כ${exp.title} בחברת ${exp.company}.`];
        } else if (helpers?.hasQualityContent && !helpers.hasQualityContent({ description })) {
          description = [
            `כ${exp.title} בחברת ${exp.company}, ${description[0] || 'ביצעתי משימות מקצועיות ותרמתי להצלחת הצוות.'}`
          ];
        }

        // Dynamic skill inference (if provided)
        const inferred = inferSkills(helpers, {
          descriptions: description,
          experience: exp,
          updates,
          resume: currentResume
        });

        if (inferred.length > 0) {
          const existingSkills = new Set((currentResume.skills || []).map((s) => s.toLowerCase().trim()));
          const toAdd = inferred.filter((s) => !existingSkills.has(s.toLowerCase().trim()));
          if (toAdd.length) storeActions.addSkills(toAdd);
        }

        const duration = exp.duration && exp.duration.trim() !== 'לא צוין' ? exp.duration.trim() : undefined;

        storeActions.addOrUpdateExperience({
          id: exp.id || `${exp.company}-${exp.title}`,
          company: exp.company!,
          title: exp.title!,
          duration,
          description
        });

        addChatMessage(`✅ הוספתי ניסיון בחברת ${exp.company}.`, 'ai');
      }
    }
  }

  // --- bulk experiences ---
  if (Array.isArray(updates.experiences) && updates.experiences.length) {
    let added = 0;
    let skipped = 0;
    const allNewDescriptions: string[] = [];

    for (const exp of updates.experiences) {
      const validCompany = !!(exp.company && exp.company.trim() && exp.company !== 'Company Name');
      const validTitle = !!(exp.title && exp.title.trim() && exp.title !== 'Job Title');
      if (!validCompany || !validTitle) continue;

      if (helpers?.isDuplicateContent?.(exp, currentResume.experiences)) {
        skipped++;
        continue;
      }

      let desc = filterDesc(helpers, toArray(exp.description));
      if (desc.length === 0) desc = [`עבדתי כ${exp.title} בחברת ${exp.company}.`];

      allNewDescriptions.push(...desc);

      const duration =
        !exp.duration || exp.duration.trim() === '' || exp.duration === 'לא צוין'
          ? undefined
          : exp.duration.trim();

      storeActions.addOrUpdateExperience({
        id: exp.id || `${exp.company}-${exp.title}`,
        company: exp.company!,
        title: exp.title!,
        duration,
        description: desc
      });
      added++;
    }

    // Dynamic skill inference for bulk
    if (allNewDescriptions.length) {
      const inferred = inferSkills(helpers, {
        descriptions: allNewDescriptions,
        updates,
        resume: currentResume
      });
      if (inferred.length) {
        const existingSkills = new Set((currentResume.skills || []).map((s) => s.toLowerCase().trim()));
        const toAdd = inferred.filter((s) => !existingSkills.has(s.toLowerCase().trim()));
        if (toAdd.length) storeActions.addSkills(toAdd);
      }
    }

    if (added || skipped) {
      addChatMessage(
        `✅ הוספתי ${added} ניסיונות עבודה חדשים${skipped ? ` ודילגתי על ${skipped} כפילויות` : ''}!`,
        'ai'
      );
    }
  }

  // --- skills (trust AI-provided updates.skills) ---
  if (Array.isArray(updates.skills)) {
    const existing = new Set((currentResume.skills || []).map((s) => s.toLowerCase().trim()));
    const toAdd = updates.skills
      .map((s) => (s || '').trim())
      .filter((s) => s && !existing.has(s.toLowerCase()));
    if (toAdd.length) {
      storeActions.addSkills(toAdd);
      addChatMessage(`✅ הוספתי ${toAdd.length} כישורים חדשים!`, 'ai');
    } else if (updates.skills.length) {
      addChatMessage('💭 כל הכישורים שהזכרת כבר קיימים במערכת.', 'ai');
    }
  }

  // --- summary ---
  if (typeof updates.summary === 'string' && updates.summary.trim()) {
    storeActions.setSummary(updates.summary.trim());
    addChatMessage('📝 עדכנתי תקציר מקצועי!', 'ai');
  }

  // --- contact ---
  if (updates.contact && !(helpers?.isPlaceholderContact?.(updates.contact))) {
    storeActions.setContactInfo(updates.contact);
    addChatMessage('👤 עדכנתי פרטי קשר!', 'ai');
  }
};
