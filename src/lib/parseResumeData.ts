// src/lib/parseResumeData.ts
export interface ResumeDataPatch {
  operation?: 'patch' | 'replace' | 'reset'; // added 'reset'
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
}

interface ParseResult {
  patch?: ResumeDataPatch;
  cleanedText: string;
  rawJson?: string;
  error?: string;
  messageText?: string; // narration without the JSON block
}

function extractFirstBalancedObject(text: string): string | null {
  // Skip any leading non-brace noise (RTL markers, bullets, etc.)
  let start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

export function parseResumeData(raw: string): ParseResult {
  if (!raw) return { cleanedText: '', error: 'EMPTY_INPUT' };

  // Remove BOM / control chars
  let work = raw.replace(/^[\uFEFF]/, '');

  // Extract fenced code block first
  const fenceMatch = work.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = fenceMatch ? fenceMatch[1] : null;

  if (!candidate) {
    // Try bracketed tag extraction
    const tagIdx = work.indexOf('[RESUME_DATA]');
    if (tagIdx !== -1) {
      const after = work.slice(tagIdx + '[RESUME_DATA]'.length);
      candidate = extractFirstBalancedObject(after);
    }
  }
  if (!candidate) {
    candidate = extractFirstBalancedObject(work);
  }

  if (!candidate) {
    return { cleanedText: raw.trim(), error: 'NO_JSON_FOUND', messageText: raw.trim() };
  }

  let jsonText = candidate.trim();

  // Light normalization
  // replace smart quotes, remove trailing commas and trim
  const cleanedJson = jsonText
    .replace(/[“”\u2018\u2019]/g, '"')
    .replace(/,\s*([}\]])/g, '$1')
    .trim();

  try {
    const parsed = JSON.parse(cleanedJson);

    const patch: ResumeDataPatch = {};
    if (parsed.operation && ['patch','replace','reset'].includes(parsed.operation)) {
      patch.operation = parsed.operation;
    }
    
    // Handle completeResume first (full extraction scenario)
    if (parsed.completeResume && typeof parsed.completeResume === 'object') {
      patch.completeResume = {};
      if (Array.isArray(parsed.completeResume.experiences)) {
        patch.completeResume.experiences = parsed.completeResume.experiences;
      }
      if (Array.isArray(parsed.completeResume.skills)) {
        patch.completeResume.skills = parsed.completeResume.skills;
      }
      if (typeof parsed.completeResume.summary === 'string') {
        patch.completeResume.summary = parsed.completeResume.summary;
      }
      if (parsed.completeResume.contact && typeof parsed.completeResume.contact === 'object') {
        patch.completeResume.contact = { ...parsed.completeResume.contact };
      }
    }

    // experiences normalization: accept "experiences" or singular "experience"
    if (parsed.experiences) {
      patch.experiences = Array.isArray(parsed.experiences) ? parsed.experiences : [parsed.experiences];
    } else if (parsed.experience) {
      patch.experiences = Array.isArray(parsed.experience) ? parsed.experience : [parsed.experience];
    }

    if (Array.isArray(parsed.skills)) patch.skills = parsed.skills;
    if (typeof parsed.summary === 'string') patch.summary = parsed.summary;
    if (parsed.contact && typeof parsed.contact === 'object') {
      patch.contact = {
        fullName: parsed.contact.fullName,
        email: parsed.contact.email,
        phone: parsed.contact.phone,
        location: parsed.contact.location,
        title: parsed.contact.title
      };
    }

    // If top-level fields missing but exist inside completeResume, expose them for downstream helpers
    if (!patch.experiences && patch.completeResume?.experiences) {
      patch.experiences = patch.completeResume.experiences;
    }
    if (!patch.skills && patch.completeResume?.skills) {
      patch.skills = patch.completeResume.skills;
    }
    if (!patch.summary && patch.completeResume?.summary) {
      patch.summary = patch.completeResume.summary;
    }
    if (!patch.contact && patch.completeResume?.contact) {
      patch.contact = patch.completeResume.contact;
    }
    // If operation declared replace but no completeResume provided, keep data but allow fallback
    if (patch.operation === 'replace' && !patch.completeResume) {
      // We still treat as replace with synthesized completeResume
      patch.completeResume = {
        contact: patch.contact,
        experiences: patch.experiences,
        skills: patch.skills,
        summary: patch.summary
      };
    }

    // Build messageText (raw without the JSON candidate / wrapper artifacts)
    const jsonIndex = raw.indexOf(candidate);
    let messageText = raw;
    if (jsonIndex !== -1) {
      messageText =
        raw.slice(0, jsonIndex) +
        raw.slice(jsonIndex + candidate.length);
    }
    // Remove tags / fences leftovers
    messageText = messageText
      .replace(/\[RESUME_DATA\]/gi, '')
      .replace(/\[\/RESUME_DATA\]/gi, '')
      .replace(/```(?:json)?/gi, '')
      .replace(/```/g, '')
      .trim();

    return { patch, cleanedText: raw.trim(), rawJson: cleanedJson, messageText };
  } catch (e) {
    return { cleanedText: raw.trim(), rawJson: jsonText, error: 'JSON_PARSE_ERROR', messageText: raw.trim() };
  }
}