// src/lib/parseResumeData.ts
export interface ResumeDataPatch {
  operation?: 'patch' | 'replace' | 'reset' | 'add' | 'update' | 'remove' | 'clear' | 'redesign';
  experience?: {
    id?: string;
    company?: string;
    title?: string;
    duration?: string | null;
    description?: string[] | string | null;
  };
  experiences?: Array<{
    id?: string;
    company?: string;
    title?: string;
    duration?: string | null;
    description?: string[] | string | null;
  }>;
  skills?: string[];
  summary?: string;
  contact?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    title?: string;
  };
  completeResume?: {
    contact?: {
      fullName?: string;
      email?: string;
      phone?: string;
      location?: string;
      title?: string;
    };
    experiences?: Array<{
      id?: string;
      company?: string;
      title?: string;
      duration?: string | null;
      description?: string[] | string | null;
    }>;
    skills?: string[];
    summary?: string;
  };
  removeSkills?: string[];
  removeExperiences?: string[];
  clearSections?: string[];
}

interface ParseResult {
  patch?: ResumeDataPatch;
  cleanedText: string;
  rawJson?: string;
  error?: string;
  messageText?: string; // narration without the JSON block
}

/* helpers */
function extractFirstBalancedObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function splitToLinesPreserveHebrew(input: string): string[] {
  if (!input) return [];
  // split by newlines or bullets. Avoid splitting on sentence enders if it creates single-word items.
  const parts = input
    .split(/\r?\n|•|●|–|-{2,}/u)
    .flatMap(p => p.split(/(?<=[.!?׃؛])\s+/u)) // split by sentence enders after splitting by bullets
    .map(p => p.trim())
    .filter(p => p && p.length > 1); // filter out empty and single-character strings
  return parts;
}

function collectSkillValues(obj: any): string[] {
  if (!obj || typeof obj !== 'object') return [];
  const keys = [
    'skills', 'Skills', 'SKILLS',
    'CURRENT_SKILLS', 'current_skills', 'currentSkills',
    'current-skills', 'currentSkillsList', 'CURRENT-SKILLS', 'CURRENTSKILLS'
  ];
  const out: string[] = [];
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) out.push(...v.filter(Boolean).map(String));
    else if (typeof v === 'string') {
      out.push(...v.split(/[\n,;•\/|]+/).map((s: string) => s.trim()).filter(Boolean));
    }
  }
  return out;
}

/* main parser */
export function parseResumeData(raw: string): ParseResult {
  if (!raw) return { cleanedText: '', error: 'EMPTY_INPUT' };

  // normalize line endings and remove BOM
  const original = raw.replace(/^[\uFEFF]/, '');
  let work = original;

  // try fenced JSON block first
  const fence = work.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = fence ? fence[1] : null;

  // try [RESUME_DATA] tag
  if (!candidate) {
    const tagIdx = work.search(/\[RESUME_DATA\]/i);
    if (tagIdx !== -1) {
      const after = work.slice(tagIdx + '[RESUME_DATA]'.length);
      candidate = extractFirstBalancedObject(after);
    }
  }

  // fallback: first balanced object anywhere
  if (!candidate) candidate = extractFirstBalancedObject(work);

  if (!candidate) {
    return { cleanedText: original.trim(), error: 'NO_JSON_FOUND', messageText: original.trim() };
  }

  // light clean: smart quotes, trailing commas, stray backticks
  let jsonText = candidate.trim();
  let cleanedJson = jsonText
    .replace(/[“”‘’‛❝❞]/g, '"')
    .replace(/\u00A0/g, ' ')
    .replace(/,\s*([}\]])/g, '$1') // remove trailing commas
    .replace(/```/g, '')
    .trim();

  // try parse, if fails attempt gentle recovery
  let parsed: any = null;
  try {
    parsed = JSON.parse(cleanedJson);
  } catch (e) {
    // recovery attempts: replace single quotes, remove non-json prefixes, try to extract balanced braces again
    const alt = cleanedJson
      .replace(/([{\[,]\s*)'([^']*)'(?=\s*[:\],}])/g, '$1"$2"') // 'key' -> "key"
      .replace(/'([^']*)'(?=\s*[,\]}])/g, '"$1"') // 'value' -> "value"
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[^\x20-\x7E\u0590-\u05FF\r\n\t{}[\]":,.-]/g, ''); // strip weird control characters
    try {
      parsed = JSON.parse(alt);
      cleanedJson = alt;
    } catch {
      // final attempt: try to recover with a smaller balanced region
      const brace = extractFirstBalancedObject(cleanedJson);
      if (brace) {
        try {
          parsed = JSON.parse(brace);
          cleanedJson = brace;
        } catch {
          return { cleanedText: original.trim(), rawJson: cleanedJson, error: 'JSON_PARSE_ERROR', messageText: original.trim() };
        }
      } else {
        return { cleanedText: original.trim(), rawJson: cleanedJson, error: 'JSON_PARSE_ERROR', messageText: original.trim() };
      }
    }
  }

  const patch: ResumeDataPatch = {};

  // operation
  if (parsed.operation && ['patch', 'replace', 'reset'].includes(parsed.operation)) {
    patch.operation = parsed.operation;
  } else {
    patch.operation = 'patch';
  }

  // collect skills from many aliases and from completeResume
  const skillCandidates = [
    ...collectSkillValues(parsed),
    ...(parsed.completeResume ? collectSkillValues(parsed.completeResume) : [])
  ].map(s => (s || '').trim()).filter(Boolean);
  if (skillCandidates.length) {
    patch.skills = Array.from(new Set(skillCandidates));
  }

  // capture summary from many aliases with better priority
  const summaryKeys = [
    'summary', 'Summary', 'SUMMARY',
    'professional_summary', 'professionalSummary', 'professional-summary',
    'CURRENT_SUMMARY', 'currentSummary', 'current_summary',
    'headline', 'profile', 'about', 'description'
  ];
  
  // First try direct top-level summary
  for (const k of summaryKeys) {
    if (typeof parsed[k] === 'string' && parsed[k].trim()) {
      patch.summary = parsed[k].trim();
      break;
    }
  }
  
  // Then try completeResume summary if not found
  if (!patch.summary && parsed.completeResume) {
    for (const k of summaryKeys) {
      if (typeof parsed.completeResume[k] === 'string' && parsed.completeResume[k].trim()) {
        patch.summary = parsed.completeResume[k].trim();
        break;
      }
    }
  }

  // contact
  if (parsed.contact && typeof parsed.contact === 'object') {
    patch.contact = {
      fullName: parsed.contact.fullName,
      email: parsed.contact.email,
      phone: parsed.contact.phone,
      location: parsed.contact.location,
      title: parsed.contact.title
    };
  } else if (parsed.completeResume && parsed.completeResume.contact) {
    patch.contact = parsed.completeResume.contact;
  }

  // experiences: try multiple keys and normalize descriptions to string[]
  const candidateExpKeys = ['experiences', 'experience', 'work', 'jobs', 'positions', 'roles'];
  let exps: any[] | undefined = undefined;
  for (const k of candidateExpKeys) {
    const v = parsed[k] ?? (parsed.completeResume && parsed.completeResume[k]);
    if (v) {
      exps = Array.isArray(v) ? v.slice() : [v];
      break;
    }
  }
  // also accept nested: parsed.experience?.experience etc.
  if (!exps && parsed.experience && typeof parsed.experience === 'object') {
    const nested = parsed.experience.experiences || parsed.experience.work || parsed.experience;
    exps = Array.isArray(nested) ? nested : [nested];
  }

  if (exps && exps.length) {
    patch.experiences = exps.map((e: any) => {
      const descRaw = e.description ?? e.descriptions ?? e.tasks ?? '';
      let descArr: string[] = [];
      if (Array.isArray(descRaw)) {
        descArr = descRaw.map((d: any) => String(d || '').trim()).filter(Boolean);
      } else if (typeof descRaw === 'string') {
        descArr = splitToLinesPreserveHebrew(descRaw);
      } else {
        descArr = [];
      }
      // ensure each description item is trimmed and not too short garbage
      descArr = descArr.map((d: string) => d.trim()).filter(Boolean);

      return {
        id: e.id,
        company: (e.company || e.companyName || e.employer || '').trim(),
        title: (e.title || e.position || '').trim(),
        duration: e.duration || e.period || null,
        description: descArr.length ? descArr : undefined
      };
    });
  }

  // If parsed provides top-level skills array directly, ensure we capture them if not already
  if ((!patch.skills || patch.skills.length === 0) && Array.isArray(parsed.skills)) {
    patch.skills = (parsed.skills as any[]).map(s => String(s).trim()).filter(Boolean);
  }

  // If replace operation with completeResume object provided, prefer it
  if (parsed.completeResume && typeof parsed.completeResume === 'object') {
    patch.completeResume = {};
    if (Array.isArray(parsed.completeResume.experiences)) patch.completeResume.experiences = parsed.completeResume.experiences;
    if (Array.isArray(parsed.completeResume.skills)) patch.completeResume.skills = parsed.completeResume.skills;
    if (typeof parsed.completeResume.summary === 'string') patch.completeResume.summary = parsed.completeResume.summary;
    if (parsed.completeResume.contact && typeof parsed.completeResume.contact === 'object') patch.completeResume.contact = parsed.completeResume.contact;
    // if main top-level fields missing, expose them too (useful downstream)
    if (!patch.experiences && patch.completeResume.experiences) patch.experiences = patch.completeResume.experiences;
    if ((!patch.skills || patch.skills.length === 0) && patch.completeResume.skills) patch.skills = patch.completeResume.skills;
    if (!patch.summary && patch.completeResume.summary) patch.summary = patch.completeResume.summary;
    if (!patch.contact && patch.completeResume.contact) patch.contact = patch.completeResume.contact;
  }

  // messageText: remove the candidate JSON region and surrounding tags/fences
  const jsonIndex = original.indexOf(candidate);
  let messageText = original;
  if (jsonIndex !== -1) {
    messageText = (original.slice(0, jsonIndex) + original.slice(jsonIndex + candidate.length)).trim();
  }
  messageText = messageText
    .replace(/\[RESUME_DATA\]/gi, '')
    .replace(/\[\/RESUME_DATA\]/gi, '')
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { patch, cleanedText: original.trim(), rawJson: cleanedJson, messageText };
}