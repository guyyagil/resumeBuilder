import type { NormalizedResumePatch, RawAIResumeData } from '../types';

export const safeJsonParse = (raw: string): any | null => {
  try {
    return JSON.parse(raw);
  } catch {
    const cleaned = raw
      .replace(/^[\s`]+|[\s`]+$/g, '')
      .replace(/[“”]/g, '"')
      .replace(/,\s*([}\]])/g, '$1');
    try { return JSON.parse(cleaned); } catch { return null; }
  }
};

// Robust malformed recovery (RTL / polluted output)
export const recoverMalformedResumeJson = (raw: string): any | null => {
  let region = raw;
  const startIdx = raw.search(/\[RESUME_DATA\]/i);
  if (startIdx !== -1) {
    region = raw.slice(startIdx + '[RESUME_DATA]'.length);
    const endIdx = region.search(/\[\/RESUME_DATA\]/i);
    if (endIdx !== -1) region = region.slice(0, endIdx);
  }
  region = region
    .replace(/```/g, ' ')
    .replace(/\bjson\b/gi, ' ')
    .replace(/\[\/?RESUME_DATA\]/gi, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim();
  const braceStart = region.indexOf('{');
  if (braceStart === -1) return null;
  let depth = 0;
  let collected = '';
  for (let i = braceStart; i < region.length; i++) {
    const ch = region[i];
    collected += ch;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  if (!collected.endsWith('}')) return null;
  const cleaned = collected
    .replace(/[“”]/g, '"')
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/(\r?\n)+/g, '\n');
  return safeJsonParse(cleaned);
};

export const normalizeResumeData = (raw: RawAIResumeData): NormalizedResumePatch => {
  const patch: NormalizedResumePatch = {
    operation: raw.operation || 'patch'
  };

  // Helper: build a duration string from various possible fields (duration, startDate/endDate, period, start/end)
  const buildDuration = (obj: any): string | undefined => {
    if (!obj) return undefined;
    // Prefer explicit duration if present and non-empty
    if (obj.duration && String(obj.duration).trim()) return String(obj.duration).trim();
    // Add 'years' as a common alias for duration
    if (obj.years && String(obj.years).trim()) return String(obj.years).trim();
    // Add 'date' as another common alias for duration
    if (obj.date && String(obj.date).trim()) return String(obj.date).trim();

    // Common start/end aliases from different parsers/AI outputs (including snake_case variants)
    const start = (obj.startDate || obj.start || obj.from || obj.start_time || obj.startYear || obj.start_year || obj.start_date) ?? undefined;
    const end = (obj.endDate || obj.end || obj.to || obj.end_time || obj.endYear || obj.end_year || obj.end_date) ?? undefined;

    const s = start !== undefined && start !== null ? String(start).trim() : '';
    const e = end !== undefined && end !== null ? String(end).trim() : '';
    if (!s && !e) {
      // fallback to period field
      if (obj.period && String(obj.period).trim()) return String(obj.period).trim();
      return undefined;
    }

    // Normalize common 'present' tokens (leave to store normalizeDuration later if needed)
    if (s && e) return `${s} - ${e}`;
    if (s && !e) return `${s} - Present`;
    if (!s && e) return `${e}`;
    return undefined;
  };

  // Handle all granular operations
  if (raw.editExperienceField) {
    patch.editExperienceField = raw.editExperienceField;
  }
  if (raw.editDescriptionLine) {
    patch.editDescriptionLine = raw.editDescriptionLine;
  }
  if (raw.removeDescriptionLine) {
    patch.removeDescriptionLine = raw.removeDescriptionLine;
  }
  if (raw.addDescriptionLine) {
    patch.addDescriptionLine = {
      company: raw.addDescriptionLine.company,
      text: (raw.addDescriptionLine as any).text || (raw.addDescriptionLine as any).newText || (raw.addDescriptionLine as any).newLine,
      position: raw.addDescriptionLine.position
    };
  }
  if (raw.editContactField) {
    patch.editContactField = raw.editContactField;
  }
  if (raw.editSkill) {
    patch.editSkill = raw.editSkill;
  }
  if (raw.editSummary) {
    // Handle both string and object formats for editSummary
    if (typeof raw.editSummary === 'string') {
      patch.editSummary = {
        type: 'replace',
        text: raw.editSummary
      };
    } else {
      patch.editSummary = raw.editSummary;
    }
  }

  // Handle legacy operations
  if (raw.updateExperienceDescription) {
    patch.updateExperienceDescription = {
      company: raw.updateExperienceDescription.company,
      newDescriptions: (raw.updateExperienceDescription as any).description || raw.updateExperienceDescription.newDescriptions || []
    };
  }
  if (raw.rewriteExperience) {
    patch.rewriteExperience = raw.rewriteExperience;
  }
  if (raw.removeDescriptionFromExperience) {
    patch.removeDescriptionFromExperience = raw.removeDescriptionFromExperience;
  }
  if (raw.removeDescriptionsFromExperience) {
    patch.removeDescriptionsFromExperience = raw.removeDescriptionsFromExperience;
  }
  if (raw.replaceExperience) {
    patch.replaceExperience = raw.replaceExperience;
  }
  if (raw.appendToSummary) {
    patch.appendToSummary = raw.appendToSummary;
  }
  if (raw.replaceSkills) {
    patch.replaceSkills = raw.replaceSkills;
  }
  if (raw.reorganize) {
    patch.reorganize = raw.reorganize;
    patch.operation = 'reorganize';
  }
  if (raw.replaceComplete) {
    patch.replaceComplete = raw.replaceComplete;
    patch.operation = 'replace';
  }
  if (raw.clearSection) {
    patch.clearSection = raw.clearSection;
  }

  // Handle completeResume first (for initial CV extraction)
  if (raw.operation === 'replace' && raw.completeResume) {
    patch.completeResume = raw.completeResume;

    // Also expose top-level fields for easier access
    if (raw.completeResume.contact) {
      patch.contact = raw.completeResume.contact;
    }
    if (Array.isArray(raw.completeResume.experiences) && raw.completeResume.experiences.length > 0) {
      // Convert to single experience format for compatibility
      const firstExp = raw.completeResume.experiences[0];
      if (firstExp && typeof firstExp === 'object') {
        let desc: string[] = [];
        if (Array.isArray(firstExp.description)) {
          desc = firstExp.description.map((s: any) => String(s).trim()).filter(Boolean);
        } else if (typeof firstExp.description === 'string') {
          const descriptionStr = firstExp.description as string;
          const sentences = descriptionStr
            .split(/(?<=[.!?])\s+/)
            .map((s: string) => s.trim())
            .filter(Boolean);
          desc = sentences.length > 0 ? sentences : [descriptionStr.trim()];
        }

        patch.experience = {
          id: firstExp.id,
          company: (firstExp.company || '').trim(),
          title: (firstExp.title || '').trim(),
          duration: buildDuration(firstExp) || undefined,
          description: desc
        };
      }
    }
    if (Array.isArray(raw.completeResume.skills)) {
      patch.skills = Array.from(new Set(raw.completeResume.skills.map((s: any) => String(s || '').trim()).filter(Boolean)));
    }
    if (typeof raw.completeResume.summary === 'string') {
      patch.summary = raw.completeResume.summary.trim();
    }
  }

  // Handle individual experience
  let expSource: any = raw.experience ?? null;

  if (!expSource && raw && typeof raw === 'object') {
    const possibleContainers = ['experience', 'experiences', 'work', 'education', 'job', 'role', 'position'];
    for (const key of possibleContainers) {
      if ((raw as any)[key]) {
        expSource = (raw as any)[key];
        break;
      }
    }
  }

  if (Array.isArray(expSource)) expSource = expSource[0];

  if (expSource && typeof expSource === 'object') {
    const nestedKey = ['education', 'work', 'job', 'role', 'position', 'experiences', 'experience']
      .find(k => (expSource as any)[k]);
    if (nestedKey) {
      expSource = (expSource as any)[nestedKey];
      if (Array.isArray(expSource)) expSource = expSource[0];
    }

    if (expSource && typeof expSource === 'object') {
      let desc: string[] = [];
      if (Array.isArray((expSource as any).description)) {
        desc = (expSource as any).description.map((s: any) => String(s).trim()).filter(Boolean);
      } else if (typeof (expSource as any).description === 'string') {
        const sentences = (expSource as any).description
          .split(/(?<=[.!?])\s+/)
          .map((s: string) => s.trim())
          .filter(Boolean);
        desc = sentences.length > 0 ? sentences : [(expSource as any).description.trim()];
      }

      // Only set if not already set from completeResume
      if (!patch.experience) {
        patch.experience = {
          id: (expSource as any).id,
          company: ((expSource as any).company || (expSource as any).companyName || (expSource as any).employer || '').trim(),
          title: ((expSource as any).title || (expSource as any).position || '').trim(),
          duration: buildDuration(expSource) || undefined,
          description: Array.isArray(desc) ? desc : []
        };
      }
    }
  }

  // Handle skills from many possible keys / aliases and from completeResume
  const skillCandidates: string[] = [];
  const skillKeys = [
    'skills', 'Skills', 'SKILLS',
    'CURRENT_SKILLS', 'current_skills', 'currentSkills',
    'CURRENT-SKILLS', 'CURRENTSKILLS',
    'updateSkills', 'addSkills', 'newSkills' // Add these AI-generated field names
  ];
  for (const k of skillKeys) {
    const val = (raw as any)[k];
    if (Array.isArray(val)) skillCandidates.push(...val);
    else if (typeof val === 'string') {
      skillCandidates.push(...val.split(/[,;]+/).map(s => s.trim()).filter(Boolean));
    }
  }
  if (raw.completeResume && Array.isArray(raw.completeResume.skills)) {
    skillCandidates.push(...raw.completeResume.skills);
  }
  if (skillCandidates.length) {
    patch.skills = Array.from(new Set(skillCandidates.map((s: string) => (s || '').trim()).filter(Boolean)));
  }

  if (Array.isArray(raw.removeSkills)) patch.removeSkills = raw.removeSkills;
  if (Array.isArray(raw.removeExperiences)) patch.removeExperiences = raw.removeExperiences;
  if (Array.isArray(raw.clearSections)) patch.clearSections = raw.clearSections;
  if (typeof raw.summary === 'string') patch.summary = raw.summary;
  if (raw.operation === 'replace' && raw.completeResume) {
    patch.completeResume = raw.completeResume;
  }
  if (raw.contact && typeof raw.contact === 'object') {
    patch.contact = {
      fullName: raw.contact.fullName?.trim(),
      email: raw.contact.email?.trim(),
      phone: raw.contact.phone?.trim(),
      location: raw.contact.location?.trim(),
      title: raw.contact.title?.trim()
    };
  }
  if (!patch.contact && (raw as any).completeResume?.contact) {
    patch.contact = (raw as any).completeResume.contact;
  }

  // Pass through granular update/delete operations
  if (raw.rewriteExperience) {
    patch.rewriteExperience = raw.rewriteExperience;
    // If the main operation is just a patch, upgrade it to rewrite for clarity
    if (patch.operation === 'patch') {
      patch.operation = 'rewrite';
    }
  }
  if (raw.updateExperienceDescription) {
    patch.updateExperienceDescription = raw.updateExperienceDescription;
  }
  if (raw.removeDescriptionFromExperience) {
    patch.removeDescriptionFromExperience = raw.removeDescriptionFromExperience;
  }
  if (raw.removeDescriptionsFromExperience) {
    patch.removeDescriptionsFromExperience = raw.removeDescriptionsFromExperience;
  }
  if (raw.replaceExperience) {
    patch.replaceExperience = raw.replaceExperience;
  }

  return patch;
};

// Extract tech-only lines from description into skills
export const refineResumePatch = async (
  patch: NormalizedResumePatch,
  inferSoftSkills?: (text: string) => Promise<string[]>
): Promise<NormalizedResumePatch> => {
  if (!patch) return patch;

  const TECH_TOKEN = /^[A-Za-z0-9+.#-]{2,60}$/;
  const hasHebrew = (s: string) => /[\u0590-\u05FF]/.test(s);
  const softSkillMap: [RegExp, string][] = [
    [/\bמנהיג(ות|ות?)\b/i, 'מנהיגות'],
    [/\bניהול\b/i, 'ניהול'],
    [/\bעבודה בצוות\b/i, 'עבודת צוות'],
    [/\bתקשורת\b/i, 'תקשורת בין אישית'],
    [/\bמשמעת\b/i, 'משמעת עצמית'],
    [/\bאסרטיב/i, 'אסרטיביות'],
    [/\bשירותי/i, 'שירותיות'],
    [/\bעצמאי/i, 'עבודה עצמאית'],
    [/\bפתרון בעיות\b/i, 'פתרון בעיות'],
    [/\bעבודה תחת לחץ\b/i, 'עבודה בתנאי לחץ'],
    [/\bניהול זמן\b/i, 'ניהול זמן'],
    [/\bמכירות\b/i, 'מכירות'],
    [/\bשירות לקוחות\b/i, 'שירות לקוחות'],
    [/\bעמידה ביעדים\b/i, 'עמידה ביעדים'],
    [/\bאבטחה\b/i, 'אבטחה'],
    [/\bהדרכה\b/i, 'הדרכה'],
    [/\bשימור לקוחות\b/i, 'שימור לקוחות']
  ];

  const existing = new Set((patch.skills || []).map(s => (s || '').trim()).filter(Boolean));

  const splitCandidates = (line: string) =>
    line.split(/[,/|•;]+|\s{2,}/).map(t => t.trim()).filter(Boolean);

  const looksLikeTechList = (trimmed: string) => {
    const tokens = splitCandidates(trimmed);
    if (tokens.length < 2) return false;
    // require most tokens to be single-token tech-like items and short average words
    const techCount = tokens.filter(t => TECH_TOKEN.test(t.replace(/\.$/, '')) && t.length <= 60).length;
    const avgWords = tokens.reduce((s, t) => s + (t.split(/\s+/).length), 0) / tokens.length;
    return techCount >= Math.ceil(tokens.length * 0.6) && avgWords <= 1.2;
  };

  const collectAndStripFromList = (descArr: string[] = []): string[] => {
    const kept: string[] = [];
    for (const raw of descArr) {
      const trimmed = (raw || '').trim();
      if (!trimmed) continue;

      if (!hasHebrew(trimmed) && looksLikeTechList(trimmed)) {
        // extract tokens to skills and DO NOT keep the line in description
        const tokens = splitCandidates(trimmed).map(t => t.replace(/\.$/, '').trim()).filter(Boolean);
        tokens.forEach(t => existing.add(t));
        continue; // drop from description
      }

      // not a tech-only line -> keep
      kept.push(trimmed);

      // also infer soft skills from kept Hebrew lines but do not remove them
      if (hasHebrew(trimmed)) {
        for (const [rx, label] of softSkillMap) {
          try {
            if (rx.test(trimmed)) existing.add(label);
          } catch { /* ignore */ }
        }
      }
    }
    return kept;
  };

  // Handle experiences array (support both explicit 'experiences' and legacy 'experience' arrays)
  const experiencesArr: any[] | undefined = Array.isArray((patch as any).experiences)
    ? (patch as any).experiences
    : (Array.isArray((patch as any).experience) ? (patch as any).experience : undefined);

  if (Array.isArray(experiencesArr)) {
    for (const e of experiencesArr as any[]) {
      if (!e) continue;
      const descArr = Array.isArray(e.description) ? e.description.slice() : (typeof e.description === 'string' ? [e.description] : []);
      const cleaned = collectAndStripFromList(descArr);
      // mutate description to the cleaned list (keep at least undefined if empty)
      if (cleaned.length) e.description = cleaned;
      else delete e.description;
    }
  }

  // Handle single experience shape
  if (patch.experience && typeof patch.experience === 'object') {
    const descArr = Array.isArray((patch.experience as any).description)
      ? (patch.experience as any).description.slice()
      : (typeof (patch.experience as any).description === 'string' ? [(patch.experience as any).description] : []);
    const cleaned = collectAndStripFromList(descArr);
    if (cleaned.length) (patch.experience as any).description = cleaned;
    else delete (patch.experience as any).description;
  }

  // If caller supplied an AI inferer, call it with combined descriptions (kept descriptions only)
  if (typeof inferSoftSkills === 'function') {
    try {
      const allDesc = [
        ...(Array.isArray(experiencesArr)
          ? experiencesArr.flatMap((e: any) => (Array.isArray(e.description) ? e.description : []))
          : []),
        ...(patch.experience && Array.isArray((patch.experience as any).description)
          ? (patch.experience as any).description
          : [])
      ].filter(Boolean).join('\n\n');

      if (allDesc) {
        const aiSkills = await inferSoftSkills(allDesc);
        (aiSkills || []).map(s => existing.add((s || '').trim()));
      }
    } catch (err) {
      console.warn('AI soft-skill inference failed:', err);
    }
  }

  // Enhanced skill extraction from experience content
  const extractMoreSkills = (text: string) => {
    // Technical skills
    const techPatterns = [
      /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|PHP|Ruby|Node\.js|React|Angular|Vue)\b/gi,
      /\b(AWS|Azure|Docker|Kubernetes|Git|SQL|MongoDB|PostgreSQL)\b/gi
    ];

    techPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => existing.add(match.trim()));
      }
    });
  };

  // Apply enhanced extraction to all descriptions
  const allDescriptions = [
    ...(Array.isArray(experiencesArr)
      ? experiencesArr.flatMap((e: any) => (Array.isArray(e.description) ? e.description : []))
      : []),
    ...(patch.experience && Array.isArray((patch.experience as any).description)
      ? (patch.experience as any).description
      : [])
  ];

  if (allDescriptions.length > 0) {
    extractMoreSkills(allDescriptions.join(' '));
  }

  // Assign merged skills back to patch (preserve order by converting Set to array)
  const merged = Array.from(existing);
  if (merged.length) patch.skills = merged;

  return patch;
};