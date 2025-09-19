import type { Experience, Education, RawExperience, RawEducation } from './types';

/* ===========================
   Utilities (small & focused)
   =========================== */

export const makeId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const norm = (s?: string) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');

export const sameByCompanyTitle = (a: Partial<Experience>, b: Partial<Experience>) =>
  !!a && !!b && norm(a.company) === norm(b.company) && norm(a.title) === norm(b.title);

export const normalizeDescriptions = (d?: string[] | string | null): string[] => {
  if (Array.isArray(d)) return d.map(x => (x || '').toString().trim()).filter(Boolean);
  if (typeof d === 'string') return d.trim() ? [d.trim()] : [];
  return [];
};

// keep sentences, drop tech-list/boilerplate (compact)
export const filterEnglishDescriptions = (descriptions: string[]): string[] => {
  const hasHeb = (t: string) => /[\u0590-\u05FF]/.test(t);
  const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
  const TECH = /^[A-Za-z0-9+.#-]{2,30}$/;
  const looksList = (t: string) => {
    const tokens = t.split(/[,/|•;]+|\s{2,}/).map(x => x.trim()).filter(Boolean);
    if (tokens.length < 2) return false;
    const techCount = tokens.filter(x => TECH.test(x.replace(/\.$/, '')) && x.length <= 30).length;
    return techCount >= Math.ceil(tokens.length * 0.6);
  };
  const looksPlaceholder = (t: string) => {
    const l = t.toLowerCase().trim();
    return l.includes('add measurable') || l.includes('responsibility') || l === 'key responsibility';
  };
  const looksSentence = (t: string) =>
    !!t &&
    (hasHeb(t) || /[.!?]$/.test(t) || words(t) >= 6 || /\b(develop|led|manage|implemented|build|maintain|design)\b/i.test(t));
  const out: string[] = [];
  for (const raw of descriptions) {
    const d = (raw || '').toString().trim();
    if (!d || looksPlaceholder(d) || looksList(d)) continue;
    if (looksSentence(d) || (hasHeb(d) && d.length > 3)) out.push(d);
  }
  return out;
};

export const normalizeDuration = (raw?: string | null): string | undefined => {
  if (raw == null) return undefined;
  let s = String(raw).trim();
  if (!s) return undefined;
  if (/^(לא\s*צוין|לא\s*צויין|n\/a|none|unknown|not specified)$/i.test(s)) return undefined;
  s = s.replace(/[\u2012\u2013\u2014\u2015–—−]/g, '-').replace(/\s*-\s*/g, ' - ').replace(/\s{2,}/g, ' ').trim();
  if (/\b(עד היום|הווה|Present|present|now|current)\b/i.test(s)) {
    s = s.replace(/\b(עד היום|הווה|Present|present|now|current)\b/i, m => m.trim());
  }
  return s || undefined;
};

export const dedupeSkills = (arr: string[]) =>
  Array.from(new Set(arr.map(s => (s || '').trim()).filter(Boolean)));

export const sanitizeExperience = (x: RawExperience): Experience => ({
  id: x.id || makeId(),
  company: (x.company || '').trim(),
  title: (x.title || '').trim(),
  duration: normalizeDuration(x.duration ?? undefined) || '',
  description: filterEnglishDescriptions(normalizeDescriptions(x.description)),
});

export const sanitizeEducation = (x: RawEducation): Education => ({
  id: x.id || makeId(),
  institution: (x.institution || '').trim(),
  degree: (x.degree || '').trim(),
  duration: normalizeDuration(x.duration ?? undefined) || '',
  description: filterEnglishDescriptions(normalizeDescriptions(x.description)),
});

export const upsertExperience = (list: Experience[], incoming: Experience): Experience[] => {
  const i = list.findIndex(e => (incoming.id && e.id === incoming.id) || sameByCompanyTitle(e, incoming));
  if (i === -1) return [...list, incoming];
  const prev = list[i];
  const next: Experience = {
    ...prev,
    ...incoming,
    // merge descriptions without dupes (case-insensitive)
    description: (() => {
      const seen = new Set(prev.description.map(d => d.toLowerCase().trim()));
      const out = [...prev.description];
      for (const d of incoming.description) {
        const k = d.toLowerCase().trim();
        if (!seen.has(k)) {
          seen.add(k);
          out.push(d);
        }
      }
      return out;
    })(),
    // Fix: Allow explicit duration updates, including empty strings
    duration: incoming.hasOwnProperty('duration') ? incoming.duration || '' : prev.duration,
  };
  const copy = [...list];
  copy[i] = next;
  return copy;
};

export const removeExperienceByIdOrCompany = (list: Experience[], idOrCompany: string): Experience[] =>
  list.filter(e => !((e.id && e.id === idOrCompany) || norm(e.company) === norm(idOrCompany)));

export const upsertEducation = (list: Education[], incoming: Education): Education[] => {
  const i = list.findIndex(e => (incoming.id && e.id === incoming.id) || (norm(e.institution) === norm(incoming.institution) && norm(e.degree) === norm(incoming.degree)));
  if (i === -1) return [...list, incoming];
  const prev = list[i];
  const next: Education = {
    ...prev,
    ...incoming,
    description: (() => {
      const seen = new Set(prev.description.map(d => d.toLowerCase().trim()));
      const out = [...prev.description];
      for (const d of incoming.description) {
        const k = d.toLowerCase().trim();
        if (!seen.has(k)) {
          seen.add(k);
          out.push(d);
        }
      }
      return out;
    })(),
    duration: incoming.hasOwnProperty('duration') ? incoming.duration || '' : prev.duration,
  };
  const copy = [...list];
  copy[i] = next;
  return copy;
};

export const removeEducationByIdOrInstitution = (list: Education[], idOrInstitution: string): Education[] =>
  list.filter(e => !((e.id && e.id === idOrInstitution) || norm(e.institution) === norm(idOrInstitution)));