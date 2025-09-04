import { create } from 'zustand';
import { z } from 'zod';

// Simplified onboarding schema
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
  title?: string; // headline / current role
}

interface ResumeDataPatch {
  operation?: 'patch' | 'replace';
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
}

interface AppStore {
  currentScreen: 'welcome' | 'chat';
  userBasicInfo: WelcomeFormData | null;
  chatMessages: ChatMessage[];
  resume: Resume;
  targetJobPosting?: string;
  originalResumeText?: string;

  setUserBasicInfo: (data: WelcomeFormData) => void;
  goToChat: () => void;
  addChatMessage: (content: string, type: 'user' | 'ai') => void;
  setTargetJobPosting: (text: string) => void;
  setOriginalResumeText: (text: string) => void;

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
}

const makeId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Helper function to filter English descriptions (keep sentences, drop tech-lists/generic prompts)
const filterEnglishDescriptions = (descriptions: string[]): string[] => {
  const hasHebrew = (text: string) => /[\u0590-\u05FF]/.test(text);
  const WORD_COUNT = (t: string) => (t.trim().split(/\s+/).filter(Boolean).length);

  // token looks like a technology / single token (React, Node.js, AWS)
  const TECH_TOKEN = /^[A-Za-z0-9+.#-]{2,30}$/;

  const looksLikeTechList = (text: string) => {
    const tokens = text.split(/[,/|•;]+|\s{2,}/).map(t => t.trim()).filter(Boolean);
    if (tokens.length < 2) return false;
    // consider it a tech list only if most tokens are single-token tech-like strings
    const techCount = tokens.filter(t => TECH_TOKEN.test(t.replace(/\.$/, '')) && t.length <= 30).length;
    return techCount >= Math.ceil(tokens.length * 0.6);
  };

  const looksLikeGenericPlaceholder = (text: string) => {
    const lower = text.toLowerCase().trim();
    return (
      lower.includes('add measurable accomplishment') ||
      lower.includes('add measurable') ||
      lower.includes('responsibility') ||
      lower === 'key responsibility' ||
      lower.includes('accomplishment or responsibility') ||
      lower.match(/^(add|key|responsibilit(y|ies))/i)
    );
  };

  const looksLikeSentence = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return false;
    // Hebrew lines are fine
    if (hasHebrew(trimmed)) return true;
    // sentences usually end with punctuation or have enough words
    if (/[.!?]$/.test(trimmed)) return true;
    if (WORD_COUNT(trimmed) >= 6) return true;
    // short English sentences that contain a verb-like token (common verbs)
    if (/\b(develop|led|manage|implemented|build|maintain|design|developed|managed|led|implemented)\b/i.test(trimmed)) return true;
    return false;
  };

  const out: string[] = [];
  for (const raw of descriptions) {
    const d = (raw || '').toString().trim();
    if (!d) continue;
    if (looksLikeGenericPlaceholder(d)) continue;
    if (looksLikeTechList(d)) {
      // treat as tech list -> remove from description. Upstream refiner may collect tokens as skills.
      continue;
    }
    if (looksLikeSentence(d)) {
      out.push(d);
      continue;
    }
    // fallback: if Hebrew short phrase keep, else drop
    if (hasHebrew(d) && d.length > 3) out.push(d);
  }
  return out;
};

export const useAppStore = create<AppStore>((set, get) => ({
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
  targetJobPosting: undefined,
  originalResumeText: undefined,

  // Actions
  setUserBasicInfo: (data) => set({ userBasicInfo: data }),

  setTargetJobPosting: (text) =>
    set((state) => ({
      targetJobPosting: text,
      userBasicInfo: {
        ...(state.userBasicInfo || {}),
        targetJobPosting: text,
      } as WelcomeFormData,
    })),

  setOriginalResumeText: (text) => set({ originalResumeText: text }),

  goToChat: () => set({ currentScreen: 'chat' }),

  addChatMessage: (content, type) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        { id: makeId(), type, content, timestamp: new Date() },
      ],
    })),

  setContactInfo: (c) =>
    set((state) => ({
      resume: { ...state.resume, ...c },
      userBasicInfo: {
        ...(state.userBasicInfo || {}),
        ...(c.fullName ? { fullName: c.fullName } : {}),
        ...(c.title ? { currentRole: c.title } : {}),
        ...(c.email ? { email: c.email } : {}),
        ...(c.phone ? { phone: c.phone } : {}),
        ...(c.location ? { location: c.location } : {}),
      },
    })),

  updateResume: (updates) =>
    set((state) => ({ resume: { ...state.resume, ...updates } })),

  addOrUpdateExperience: (incoming) =>
    set((state) => {
      // Filter descriptions before processing
      const filteredDescriptions = incoming.description 
        ? filterEnglishDescriptions(Array.isArray(incoming.description) ? incoming.description : [incoming.description])
        : [];

      const exp: Experience = {
        ...incoming,
        id: incoming.id || makeId(),
        description: Array.from(new Set(filteredDescriptions.length > 0 ? filteredDescriptions : ['תיאור התפקיד יתווסף בהמשך.'])),
      };

      const idx = state.resume.experiences.findIndex(
        (e) =>
          (exp.id && e.id && e.id === exp.id) ||
          (e.company &&
            exp.company &&
            e.company.trim().toLowerCase() === exp.company.trim().toLowerCase())
      );

      if (idx !== -1) {
        const prev = state.resume.experiences[idx];
        const mergedDescriptions = Array.from(
          new Set([...(prev.description || []), ...(exp.description || [])])
        );
        const filteredMerged = filterEnglishDescriptions(mergedDescriptions);
        
        const merged: Experience = {
          ...prev,
          ...exp,
          id: prev.id || exp.id,
          description: filteredMerged.length > 0 ? filteredMerged : ['תיאור התפקיד יתווסף בהמשך.'],
        };
        const experiences = [...state.resume.experiences];
        experiences[idx] = merged;
        return { resume: { ...state.resume, experiences } };
      }

      return {
        resume: {
          ...state.resume,
          experiences: [...state.resume.experiences, exp],
        },
      };
    }),

  removeExperience: (idOrCompany) =>
    set((state) => ({
      resume: {
        ...state.resume,
        experiences: state.resume.experiences.filter(
          (e) =>
            !(
              (e.id && e.id === idOrCompany) ||
              e.company.trim().toLowerCase() ===
                idOrCompany.trim().toLowerCase()
            )
        ),
      },
    })),

  clearAllExperiences: () =>
    set((state) => ({
      resume: { ...state.resume, experiences: [] },
    })),

  replaceAllExperiences: (experiences) =>
    set((state) => {
      const filteredExperiences = experiences.map(exp => ({
        ...exp,
        description: exp.description 
          ? filterEnglishDescriptions(Array.isArray(exp.description) ? exp.description : [exp.description])
          : []
      }));
      
      return {
        resume: { ...state.resume, experiences: filteredExperiences },
      };
    }),

  addSkills: (newSkills) =>
    set((state) => ({
      resume: {
        ...state.resume,
        skills: Array.from(
          new Set([
            ...state.resume.skills,
            ...newSkills.map((s) => s.trim()).filter(Boolean),
          ])
        ),
      },
    })),

  removeSkills: (skillsToRemove) =>
    set((state) => {
      const toRemove = skillsToRemove.map((s) => s.toLowerCase().trim());
      return {
        resume: {
          ...state.resume,
          skills: state.resume.skills.filter(
            (s) => !toRemove.includes(s.toLowerCase().trim())
          ),
        },
      };
    }),

  replaceSkills: (newSkills) =>
    set((state) => ({
      resume: {
        ...state.resume,
        skills: newSkills.map((s) => s.trim()).filter(Boolean),
      },
    })),

  clearAllSkills: () =>
    set((state) => ({
      resume: { ...state.resume, skills: [] },
    })),

  setSummary: (summary) =>
    set((state) => ({
      resume: { ...state.resume, summary },
    })),

  clearSummary: () =>
    set((state) => ({
      resume: { ...state.resume, summary: '' },
    })),

  resetResume: () =>
    set(() => ({
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
    set(() => ({
      resume: newResume,
    })),

  applyResumeDataPatch: (patch) => {
    if (!patch || typeof patch !== 'object') return;
    const op = patch.operation || 'patch';
    const current = get().resume;

    const normalizeExperiences = (
      list: ResumeDataPatch['experiences']
    ): Experience[] => {
      if (!Array.isArray(list)) return [];
      return list
        .filter((e) => e && (e.company || e.title))
        .map((e) => {
          const descArr = Array.isArray(e.description)
            ? e.description
            : typeof e.description === 'string'
            ? [e.description]
            : [];
          
          // Filter English descriptions
          const filteredDesc = filterEnglishDescriptions(descArr.filter(Boolean).map((d) => d.trim()));
          
          return {
            id: e.id,
            company: (e.company || 'Unknown').trim(),
            title: (e.title || '').trim(),
            duration: e.duration || undefined,
            description: filteredDesc.length > 0 ? Array.from(new Set(filteredDesc)) : ['תיאור התפקיד יתווסף בהמשך.'],
          };
        });
    };

    if (op === 'replace') {
      // If completeResume present prefer it; else synthesize from supplied top-level arrays
      if ((patch as any).completeResume) {
        const cr = (patch as any).completeResume;
        const newResume: Resume = {
          experiences: normalizeExperiences(cr.experiences) || [],
          skills: Array.isArray(cr.skills)
            ? Array.from(new Set(cr.skills.map((s: string) => s.trim()).filter(Boolean)))
            : [],
          summary: typeof cr.summary === 'string' ? cr.summary.trim() : '',
          fullName: cr.contact?.fullName?.trim() || '',
          email: cr.contact?.email?.trim() || '',
          phone: cr.contact?.phone?.trim() || '',
          location: cr.contact?.location?.trim() || '',
          title: cr.contact?.title?.trim() || '',
        };
        set({ resume: newResume });
        return;
      } else {
        const newResume: Resume = {
          experiences: normalizeExperiences(patch.experiences) || current.experiences,
          skills: Array.isArray(patch.skills)
            ? Array.from(new Set(patch.skills.map((s) => s.trim()).filter(Boolean)))
            : current.skills,
          summary: typeof patch.summary === 'string' ? patch.summary.trim() : current.summary,
          fullName: patch.contact?.fullName?.trim() ?? current.fullName ?? '',
          email: patch.contact?.email?.trim() ?? current.email ?? '',
            phone: patch.contact?.phone?.trim() ?? current.phone ?? '',
          location: patch.contact?.location?.trim() ?? current.location ?? '',
          title: patch.contact?.title?.trim() ?? current.title ?? '',
        };
        set({ resume: newResume });
        return;
      }
    }

    // Patch merge
    if (Array.isArray(patch.experiences)) {
      normalizeExperiences(patch.experiences).forEach((exp) => {
        get().addOrUpdateExperience(exp);
      });
    }
    if (Array.isArray(patch.skills)) {
      get().addSkills(patch.skills);
    }
    if (typeof patch.summary === 'string' && patch.summary.trim()) {
      get().setSummary(patch.summary.trim());
    }
    if (patch.contact) {
      get().setContactInfo(patch.contact);
    }
  },
}));