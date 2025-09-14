import { create } from 'zustand';
import { z } from 'zod';

/* ===========================
   Types (as provided)
   =========================== */

const welcomeFormSchema = z.object({
  targetJobPosting: z.string().optional(),
});
type WelcomeFormData = z.infer<typeof welcomeFormSchema>;

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface Experience {
  id?: string;
  company: string;
  title: string;
  duration?: string;
  description: string[];
}

interface Resume {
  experiences: Experience[];
  skills: string[];
  summary: string;
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  title?: string;
}

interface ResumeDataPatch {
  operation?: 'patch' | 'replace' | 'reset' | 'add' | 'update' | 'remove' | 'clear' | 'redesign' | 'reorganize' | 'delete' | 'rewrite';
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
  clearSections?: string[]; // e.g., ["experiences","skills","summary","contact"]

  // New granular operations
  editExperienceField?: {
    company: string;
    field: 'company' | 'title' | 'duration';
    newValue: string;
  };
  editDescriptionLine?: {
    company: string;
    lineIndex: number;
    newText: string;
  };
  removeDescriptionLine?: {
    company: string;
    lineIndex: number;
  };
  addDescriptionLine?: {
    company: string;
    text: string;
    position?: number; // optional position, defaults to end
  };
  editContactField?: {
    field: 'fullName' | 'email' | 'phone' | 'location' | 'title';
    value: string;
  };
  editSkill?: {
    oldSkill: string;
    newSkill: string;
  };
  editSummary?: {
    type: 'replace' | 'append' | 'prepend';
    text: string;
  };
  appendToSummary?: string;
  replaceSkills?: string[];
  reorganize?: {
    experiences?: Experience[] | string[];
    skills?: string[];
    summary?: string;
    contact?: Partial<Pick<Resume, 'fullName' | 'email' | 'phone' | 'location' | 'title'>>;
  };
  replaceComplete?: Resume;
  clearSection?: 'experiences' | 'skills' | 'summary' | 'contact';
  updateExperienceDescription?: {
    company: string;
    newDescriptions: string[];
  };
}

interface AppStore {
  currentScreen: 'welcome' | 'chat';
  userBasicInfo: WelcomeFormData | null;
  chatMessages: ChatMessage[];
  resume: Resume;
  resumeHistory: Resume[];
  targetJobPosting?: string;
  originalResumeText?: string;

  setUserBasicInfo: (data: WelcomeFormData) => void;
  goToChat: () => void;
  addChatMessage: (content: string, type: 'user' | 'ai') => void;
  setTargetJobPosting: (text: string) => void;
  setOriginalResumeText: (text: string) => void;

  // Undo functionality
  undo: () => void;
  saveToHistory: () => void;

  updateResume: (updates: Partial<Resume>) => void;

  addOrUpdateExperience: (experience: Experience) => void;
  removeExperience: (idOrCompany: string) => void;
  clearAllExperiences: () => void;
  replaceAllExperiences: (experiences: Experience[]) => void;

  addSkills: (newSkills: string[]) => void;
  removeSkills: (skillsToRemove: string[]) => void;
  replaceSkills: (newSkills: string[]) => void;
  clearAllSkills: () => void;

  setSummary: (summary: string) => void;
  clearSummary: () => void;

  resetResume: () => void;
  replaceEntireResume: (newResume: Resume) => void;
  applyResumeDataPatch: (patch: ResumeDataPatch) => void;

  setContactInfo: (
    c: Partial<Pick<Resume, 'fullName' | 'email' | 'phone' | 'location' | 'title'>>
  ) => void;

  // New granular methods
  editExperienceField: (company: string, field: 'company' | 'title' | 'duration', newValue: string) => void;
  editDescriptionLine: (company: string, lineIndex: number, newText: string) => void;
  removeDescriptionLine: (company: string, lineIndex: number) => void;
  addDescriptionLine: (company: string, text: string, position?: number) => void;
  editContactField: (field: 'fullName' | 'email' | 'phone' | 'location' | 'title', value: string) => void;
  editSkill: (oldSkill: string, newSkill: string) => void;
  editSummary: (type: 'replace' | 'append' | 'prepend', text: string) => void;
  reorganizeResume: (data: {
    experiences?: Experience[] | string[];
    skills?: string[];
    summary?: string;
    contact?: Partial<Pick<Resume, 'fullName' | 'email' | 'phone' | 'location' | 'title'>>;
  }) => void;
  clearSection: (section: 'experiences' | 'skills' | 'summary' | 'contact') => void;
  cleanDuplicateDescriptions: () => void;
}

/* ===========================
   Utilities (small & focused)
   =========================== */

const makeId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const norm = (s?: string) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');

const sameByCompanyTitle = (a: Partial<Experience>, b: Partial<Experience>) =>
  !!a && !!b && norm(a.company) === norm(b.company) && norm(a.title) === norm(b.title);

const normalizeDescriptions = (d?: string[] | string | null): string[] => {
  if (Array.isArray(d)) return d.map(x => (x || '').toString().trim()).filter(Boolean);
  if (typeof d === 'string') return d.trim() ? [d.trim()] : [];
  return [];
};

// keep sentences, drop tech-list/boilerplate (compact)
const filterEnglishDescriptions = (descriptions: string[]): string[] => {
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

const normalizeDuration = (raw?: string | null): string | undefined => {
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

const dedupeSkills = (arr: string[]) =>
  Array.from(new Set(arr.map(s => (s || '').trim()).filter(Boolean)));

type RawExperience = {
  id?: string;
  company?: string;
  title?: string;
  duration?: string | null;
  description?: string[] | string | null;
};

const sanitizeExperience = (x: RawExperience): Experience => ({
  id: x.id || makeId(),
  company: (x.company || '').trim(),
  title: (x.title || '').trim(),
  duration: normalizeDuration(x.duration ?? undefined) || '',
  description: filterEnglishDescriptions(normalizeDescriptions(x.description)),
});

const upsertExperience = (list: Experience[], incoming: Experience): Experience[] => {
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

const removeExperienceByIdOrCompany = (list: Experience[], idOrCompany: string): Experience[] =>
  list.filter(e => !((e.id && e.id === idOrCompany) || norm(e.company) === norm(idOrCompany)));

/* ===========================
   Store
   =========================== */

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  currentScreen: 'welcome',
  userBasicInfo: null,
  chatMessages: [],
  resume: {
    experiences: [],
    skills: [],
    summary: '',
    fullName: '',
    email: '',
    phone: '',
    location: '',
    title: '',
  },
  resumeHistory: [],
  targetJobPosting: undefined,
  originalResumeText: undefined,

  /* ---------- UI state ---------- */
  setUserBasicInfo: (data) => set({ userBasicInfo: data }),
  goToChat: () => set({ currentScreen: 'chat' }),
  addChatMessage: (content, type) =>
    set((s) => ({ chatMessages: [...s.chatMessages, { id: makeId(), type, content, timestamp: new Date() }] })),
  setTargetJobPosting: (text) =>
    set((s) => ({
      targetJobPosting: text,
      userBasicInfo: { ...(s.userBasicInfo || {}), targetJobPosting: text },
    })),
  setOriginalResumeText: (text) => set({ originalResumeText: text }),

  /* ---------- Undo functionality ---------- */
  saveToHistory: () =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
    })),

  undo: () =>
    set((s) => {
      if (s.resumeHistory.length === 0) return s;
      
      const newHistory = [...s.resumeHistory];
      const previousResume = newHistory.pop();
      
      return {
        resumeHistory: newHistory,
        resume: previousResume!,
      };
    }),



  /* ---------- Resume basics ---------- */
  updateResume: (updates) => 
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: { ...s.resume, ...updates }
    })),

  setContactInfo: (c) =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: { ...s.resume, ...c },
      userBasicInfo: {
        ...(s.userBasicInfo || {}),
        ...(c.fullName ? { fullName: c.fullName } : {}),
        ...(c.title ? { currentRole: c.title } : {}),
        ...(c.email ? { email: c.email } : {}),
        ...(c.phone ? { phone: c.phone } : {}),
        ...(c.location ? { location: c.location } : {}),
      },
    })),

  setSummary: (summary) => 
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: { ...s.resume, summary }
    })),
  
  clearSummary: () => 
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: { ...s.resume, summary: '' }
    })),

  resetResume: () =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: {
        experiences: [],
        skills: [],
        summary: '',
        fullName: '',
        email: '',
        phone: '',
        location: '',
        title: '',
      },
    })),

  replaceEntireResume: (newResume) => 
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: newResume
    })),

  /* ---------- Experiences ---------- */
  addOrUpdateExperience: (experience) =>
    set((s) => {
      console.log('🔄 Merging experience update:', {
        incoming: experience,
        existing: s.resume.experiences.find(e => 
          (experience.id && e.id === experience.id) || 
          sameByCompanyTitle(e, experience)
        )
      });
      
      const result = upsertExperience(s.resume.experiences, sanitizeExperience(experience));
      
      console.log('🔄 Final merged experience:', 
        result.find(e => 
          (experience.id && e.id === experience.id) || 
          sameByCompanyTitle(e, experience)
        )
      );
      
      return {
        resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
        resume: { ...s.resume, experiences: result }
      };
    }),

  removeExperience: (idOrCompany) =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: { ...s.resume, experiences: removeExperienceByIdOrCompany(s.resume.experiences, idOrCompany) }
    })),

  clearAllExperiences: () => 
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: { ...s.resume, experiences: [] }
    })),

  replaceAllExperiences: (experiences) =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: { ...s.resume, experiences: experiences.map(sanitizeExperience) },
    })),

  /* ---------- Skills ---------- */
  addSkills: (newSkills) =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: { ...s.resume, skills: dedupeSkills([...s.resume.skills, ...newSkills]) }
    })),

  removeSkills: (skillsToRemove) =>
    set((s) => {
      const toRemove = new Set(skillsToRemove.map((x) => x.toLowerCase().trim()));
      return {
        resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
        resume: { ...s.resume, skills: s.resume.skills.filter((k) => !toRemove.has(k.toLowerCase().trim())) }
      };
    }),

  replaceSkills: (newSkills) => 
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: { ...s.resume, skills: dedupeSkills(newSkills) }
    })),
  
  clearAllSkills: () => 
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: { ...s.resume, skills: [] }
    })),

  /* ---------- Patch application (new model) ---------- */
  applyResumeDataPatch: (patch) =>
    set((s) => {
      // Save current state to history before applying patch
      const newHistory = [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))];
      let next: Resume = { ...s.resume };

      // Handle granular operations first
      if (patch.editExperienceField) {
        const { company, field, newValue } = patch.editExperienceField;
        next.experiences = next.experiences.map(exp => 
          norm(exp.company) === norm(company)
            ? { ...exp, [field]: field === 'duration' ? normalizeDuration(newValue) || '' : newValue.trim() }
            : exp
        );
      }

      if (patch.editDescriptionLine) {
        const { company, lineIndex, newText } = patch.editDescriptionLine;
        next.experiences = next.experiences.map(exp => 
          norm(exp.company) === norm(company)
            ? {
                ...exp,
                description: exp.description.map((desc, idx) => 
                  idx === lineIndex ? newText.trim() : desc
                )
              }
            : exp
        );
      }

      if (patch.removeDescriptionLine) {
        const { company, lineIndex } = patch.removeDescriptionLine;
        next.experiences = next.experiences.map(exp => 
          norm(exp.company) === norm(company)
            ? {
                ...exp,
                description: exp.description.filter((_, idx) => idx !== lineIndex)
              }
            : exp
        );
      }

      if (patch.addDescriptionLine) {
        const { company, text, position } = patch.addDescriptionLine;
        next.experiences = next.experiences.map(exp => 
          norm(exp.company) === norm(company)
            ? {
                ...exp,
                description: position !== undefined
                  ? [
                      ...exp.description.slice(0, position),
                      text.trim(),
                      ...exp.description.slice(position)
                    ]
                  : [...exp.description, text.trim()]
              }
            : exp
        );
      }

      if (patch.editContactField) {
        const { field, value } = patch.editContactField;
        next[field] = value.trim();
      }

      if (patch.editSkill) {
        const { oldSkill, newSkill } = patch.editSkill;
        next.skills = next.skills.map(skill => 
          skill.toLowerCase().trim() === oldSkill.toLowerCase().trim()
            ? newSkill.trim()
            : skill
        );
      }

      if (patch.editSummary) {
        const { type, text } = patch.editSummary;
        next.summary = type === 'replace' 
          ? text.trim()
          : type === 'append'
          ? (next.summary + ' ' + text).trim()
          : (text + ' ' + next.summary).trim();
      }

      if (patch.appendToSummary) {
        next.summary = (next.summary + ' ' + patch.appendToSummary).trim();
      }

      if (patch.replaceSkills) {
        next.skills = dedupeSkills(patch.replaceSkills);
      }

      if (patch.reorganize) {
        const { experiences, skills, summary, contact } = patch.reorganize;
        if (experiences) next.experiences = experiences.map(sanitizeExperience);
        if (skills) next.skills = dedupeSkills(skills);
        if (summary !== undefined) next.summary = summary;
        if (contact) next = { ...next, ...contact };
      }

      if (patch.replaceComplete) {
        next = patch.replaceComplete;
      }

      if (patch.clearSection) {
        if (patch.clearSection === 'experiences') next.experiences = [];
        if (patch.clearSection === 'skills') next.skills = [];
        if (patch.clearSection === 'summary') next.summary = '';
        if (patch.clearSection === 'contact') {
          next.fullName = '';
          next.email = '';
          next.phone = '';
          next.location = '';
          next.title = '';
        }
      }

      // 1) Operation: replace (complete resume)
      if (patch.operation === 'replace' && patch.completeResume) {
        next = {
          experiences: (patch.completeResume.experiences || []).map(sanitizeExperience),
          skills: dedupeSkills(patch.completeResume.skills || []),
          summary: patch.completeResume.summary || '',
          fullName: patch.completeResume.contact?.fullName || '',
          email: patch.completeResume.contact?.email || '',
          phone: patch.completeResume.contact?.phone || '',
          location: patch.completeResume.contact?.location || '',
          title: patch.completeResume.contact?.title || '',
        };
        return { resumeHistory: newHistory, resume: next };
      }

      // 2) Operation: reset
      if (patch.operation === 'reset') {
        return {
          resumeHistory: newHistory,
          resume: {
            experiences: [],
            skills: [],
            summary: '',
            fullName: '',
            email: '',
            phone: '',
            location: '',
            title: '',
          },
        };
      }

      // 3) Experience (single)
      if (patch.experience) {
        const sanitized = sanitizeExperience(patch.experience);
        if (patch.operation === 'remove') {
          next.experiences = removeExperienceByIdOrCompany(next.experiences, sanitized.id || sanitized.company);
        } else if (patch.operation === 'update' || patch.operation === 'add' || !patch.operation || patch.operation === 'patch') {
          next.experiences = upsertExperience(next.experiences, sanitized);
        }
      }

      // 4) Experiences (bulk)
      if (Array.isArray(patch.experiences)) {
        const incoming = patch.experiences.map(sanitizeExperience);
        if (patch.operation === 'remove') {
          for (const e of incoming) next.experiences = removeExperienceByIdOrCompany(next.experiences, e.id || e.company);
        } else if (patch.operation === 'update' || patch.operation === 'add' || !patch.operation || patch.operation === 'patch') {
          for (const e of incoming) next.experiences = upsertExperience(next.experiences, e);
        } else if (patch.operation === 'clear') {
          next.experiences = [];
        }
      }

      // 5) Skills
      if (Array.isArray(patch.skills)) {
        if (patch.operation === 'replace' || patch.operation === 'redesign') {
          next.skills = dedupeSkills(patch.skills);
        } else if (patch.operation === 'remove') {
          const toRemove = new Set(patch.skills.map((k) => k.toLowerCase().trim()));
          next.skills = next.skills.filter((k) => !toRemove.has(k.toLowerCase().trim()));
        } else {
          next.skills = dedupeSkills([...next.skills, ...patch.skills]);
        }
      }
      if (Array.isArray(patch.removeSkills) && patch.removeSkills.length) {
        const toRemove = new Set(patch.removeSkills.map((k) => k.toLowerCase().trim()));
        next.skills = next.skills.filter((k) => !toRemove.has(k.toLowerCase().trim()));
      }

      // 6) Summary
      if (typeof patch.summary === 'string') next.summary = patch.summary;

      // 7) Contact
      if (patch.contact) {
        next = { ...next, ...patch.contact };
      }

      // 7.5) Update experience description
      if (patch.updateExperienceDescription) {
        const { company, newDescriptions } = patch.updateExperienceDescription;
        next.experiences = next.experiences.map(exp => 
          norm(exp.company) === norm(company)
            ? { ...exp, description: newDescriptions }
            : exp
        );
      }

      // 8) Remove experiences by name/id
      if (Array.isArray(patch.removeExperiences) && patch.removeExperiences.length) {
        for (const key of patch.removeExperiences) {
          next.experiences = removeExperienceByIdOrCompany(next.experiences, key);
        }
      }

      // 9) Clear specific sections
      if (Array.isArray(patch.clearSections) && patch.clearSections.length) {
        const setClear = new Set(patch.clearSections.map((x) => x.toLowerCase().trim()));
        if (setClear.has('experiences')) next.experiences = [];
        if (setClear.has('skills')) next.skills = [];
        if (setClear.has('summary')) next.summary = '';
        if (setClear.has('contact')) {
          next.fullName = '';
          next.email = '';
          next.phone = '';
          next.location = '';
          next.title = '';
        }
      }

      return { resumeHistory: newHistory, resume: next };
    }),
  /* ---------- New granular operations ---------- */
  editExperienceField: (company, field, newValue) =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: {
        ...s.resume,
        experiences: s.resume.experiences.map(exp => 
          norm(exp.company) === norm(company)
            ? { ...exp, [field]: field === 'duration' ? normalizeDuration(newValue) || '' : newValue.trim() }
            : exp
        )
      }
    })),

  editDescriptionLine: (company, lineIndex, newText) =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: {
        ...s.resume,
        experiences: s.resume.experiences.map(exp => 
          norm(exp.company) === norm(company)
            ? {
                ...exp,
                description: exp.description.map((desc, idx) => 
                  idx === lineIndex ? newText.trim() : desc
                )
              }
            : exp
        )
      }
    })),

  removeDescriptionLine: (company, lineIndex) =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: {
        ...s.resume,
        experiences: s.resume.experiences.map(exp => 
          norm(exp.company) === norm(company)
            ? {
                ...exp,
                description: exp.description.filter((_, idx) => idx !== lineIndex)
              }
            : exp
        )
      }
    })),

  addDescriptionLine: (company, text, position) =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: {
        ...s.resume,
        experiences: s.resume.experiences.map(exp => 
          norm(exp.company) === norm(company)
            ? {
                ...exp,
                description: (() => {
                  const trimmedText = text.trim();
                  const currentDesc = exp.description || [];
                  
                  // Check if this text already exists to prevent duplicates
                  if (currentDesc.some(desc => desc.trim() === trimmedText)) {
                    return currentDesc; // Don't add duplicate
                  }
                  
                  return position !== undefined
                    ? [
                        ...currentDesc.slice(0, position),
                        trimmedText,
                        ...currentDesc.slice(position)
                      ]
                    : [...currentDesc, trimmedText];
                })()
              }
            : exp
        )
      }
    })),

  editContactField: (field, value) =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: { ...s.resume, [field]: value.trim() }
    })),

  editSkill: (oldSkill, newSkill) =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: {
        ...s.resume,
        skills: s.resume.skills.map(skill => 
          skill.toLowerCase().trim() === oldSkill.toLowerCase().trim()
            ? newSkill.trim()
            : skill
        )
      }
    })),

  editSummary: (type, text) =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: {
        ...s.resume,
        summary: type === 'replace' 
          ? text.trim()
          : type === 'append'
          ? (s.resume.summary + ' ' + text).trim()
          : (text + ' ' + s.resume.summary).trim()
      }
    })),

  reorganizeResume: (data) =>
    set((s) => {
      let experiencesToSet = s.resume.experiences;
      
      // Handle both string arrays (company names) and Experience arrays
      if (data.experiences) {
        if (Array.isArray(data.experiences) && data.experiences.length > 0) {
          const isStringArray = typeof data.experiences[0] === 'string';
          
          if (isStringArray) {
            // Reorder existing experiences based on company names
            const currentExperiences = s.resume.experiences;
            const newOrder = data.experiences as string[];
            const reorderedExperiences = [];
            
            for (const companyName of newOrder) {
              const experience = currentExperiences.find((exp: Experience) => 
                exp.company === companyName || 
                exp.company.includes(companyName) ||
                companyName.includes(exp.company)
              );
              if (experience) {
                reorderedExperiences.push(experience);
              }
            }
            
            // Add any experiences not found in the new order at the end
            const addedCompanies = reorderedExperiences.map((exp: Experience) => exp.company);
            const remainingExperiences = currentExperiences.filter((exp: Experience) => 
              !addedCompanies.includes(exp.company)
            );
            
            experiencesToSet = [...reorderedExperiences, ...remainingExperiences];
          } else {
            // Handle as Experience objects
            experiencesToSet = (data.experiences as Experience[]).map(sanitizeExperience);
          }
        }
      }
      
      return {
        resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
        resume: {
          ...s.resume,
          experiences: experiencesToSet,
          ...(data.skills && { skills: dedupeSkills(data.skills) }),
          ...(data.summary !== undefined && { summary: data.summary }),
          ...(data.contact && data.contact)
        }
      };
    }),

  clearSection: (section) =>
    set((s) => {
      const updates: Partial<Resume> = {};
      if (section === 'experiences') updates.experiences = [];
      if (section === 'skills') updates.skills = [];
      if (section === 'summary') updates.summary = '';
      if (section === 'contact') {
        updates.fullName = '';
        updates.email = '';
        updates.phone = '';
        updates.location = '';
        updates.title = '';
      }
      return { 
        resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
        resume: { ...s.resume, ...updates } 
      };
    }),

  // Utility function to clean duplicates from all experiences
  cleanDuplicateDescriptions: () =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: {
        ...s.resume,
        experiences: s.resume.experiences.map(exp => ({
          ...exp,
          description: Array.from(new Set(exp.description.map(desc => desc.trim()))).filter(Boolean)
        }))
      }
    })),

}));
