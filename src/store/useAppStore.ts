import { create } from 'zustand';
import type {
  AppStore,
  Experience,
  Education,
  Resume,
  WelcomeFormData,
  ResumeDataPatch,
} from './types';
import {
  makeId,
  norm,
  sameByCompanyTitle,
  sanitizeExperience,
  upsertExperience,
  removeExperienceByIdOrCompany,
  sanitizeEducation,
  upsertEducation,
  removeEducationByIdOrInstitution,
  dedupeSkills,
  normalizeDuration,
} from './utils';
import { applyPatchLogic } from './patch';

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  currentScreen: 'welcome',
  userBasicInfo: null,
  chatMessages: [],
  resume: {
    experiences: [],
    education: [],
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
  setUserBasicInfo: (data: WelcomeFormData) => set({ userBasicInfo: data }),
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
        education: [],
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

  /* ---------- Education ---------- */
  addOrUpdateEducation: (education: Education) =>
    set((s) => {
      const result = upsertEducation(s.resume.education, sanitizeEducation(education));
      return {
        resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
        resume: { ...s.resume, education: result }
      };
    }),

  removeEducation: (idOrInstitution) =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: { ...s.resume, education: removeEducationByIdOrInstitution(s.resume.education, idOrInstitution) }
    })),

  clearAllEducation: () =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: { ...s.resume, education: [] }
    })),

  replaceAllEducation: (educations) =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: { ...s.resume, education: educations.map(sanitizeEducation) },
    })),
  /* ---------- Skills ---------- */
  editEducationField: (institution, field, newValue) =>
    set((s) => ({
      resumeHistory: [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))],
      resume: {
        ...s.resume,
        education: s.resume.education.map(edu =>
          norm(edu.institution) === norm(institution)
            ? { ...edu, [field]: field === 'duration' ? normalizeDuration(newValue) || '' : newValue.trim() }
            : edu
        )
      }
    })),

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
  applyResumeDataPatch: (patch: ResumeDataPatch) =>
    set((s) => {
      const newHistory = [...s.resumeHistory, JSON.parse(JSON.stringify(s.resume))];
      const nextResume = applyPatchLogic(s.resume, patch);
      return { resumeHistory: newHistory, resume: nextResume };
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
      if (section === 'education') updates.education = [];
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