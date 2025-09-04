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
  messageText: string;
  rawJson?: string;
  error?: string;
}

function extractJson(text: string): { json: string | null; textBefore: string; textAfter: string } {
  const patterns = [
    /\[RESUME_DATA\]([\s\S]*?)\[\/RESUME_DATA\]/,
    /```json([\s\S]*?)```/,
    /```([\s\S]*?)```/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    // Add a check for match.index
    if (match && match[1].trim() && match.index !== undefined) {
      const json = match[1];
      const textBefore = text.substring(0, match.index).trim();
      const textAfter = text.substring(match.index + match[0].length).trim();
      return { json, textBefore, textAfter };
    }
  }

  // Fallback for object without tags
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const potentialJson = text.substring(firstBrace, lastBrace + 1);
    try {
      JSON.parse(potentialJson); // Validate it's JSON
      const textBefore = text.substring(0, firstBrace).trim();
      const textAfter = text.substring(lastBrace + 1).trim();
      return { json: potentialJson, textBefore, textAfter };
    } catch {
      // Not valid JSON, continue
    }
  }

  return { json: null, textBefore: text, textAfter: '' };
}

export function parseResumeData(raw: string): ParseResult {
  if (!raw) return { messageText: '', error: 'EMPTY_INPUT' };

  const { json: jsonText, textBefore, textAfter } = extractJson(raw);
  const messageText = [textBefore, textAfter].filter(Boolean).join('\n').trim();

  if (!jsonText) {
    return { messageText: raw.trim(), error: 'NO_JSON_FOUND' };
  }

  let parsed: any = null;
  try {
    // Clean trailing commas before parsing
    const cleanedJson = jsonText.replace(/,\s*([}\]])/g, '$1');
    parsed = JSON.parse(cleanedJson);
  } catch (e) {
    console.error("JSON parsing failed:", e);
    return { messageText, error: `JSON_PARSE_ERROR: ${e instanceof Error ? e.message : String(e)}`, rawJson: jsonText };
  }

  if (!parsed) {
    return { messageText, error: 'PARSED_EMPTY_JSON', rawJson: jsonText };
  }

  const patch: ResumeDataPatch = { operation: parsed.operation || 'patch' };

  // Summary
  if (typeof parsed.summary === 'string') {
    patch.summary = parsed.summary;
  }

  // Contact
  if (parsed.contact && typeof parsed.contact === 'object') {
    patch.contact = {
      fullName: parsed.contact.fullName,
      email: parsed.contact.email,
      phone: parsed.contact.phone,
      location: parsed.contact.location,
      title: parsed.contact.title,
    };
  }

  // Skills
  if (Array.isArray(parsed.skills)) {
    patch.skills = parsed.skills;
  }

  // Experiences
  if (Array.isArray(parsed.experiences)) {
    patch.experiences = parsed.experiences;
  }
  
  // Complete Resume
  if (parsed.completeResume) {
    patch.completeResume = parsed.completeResume;
  }

  return { patch, messageText, rawJson: jsonText };
}