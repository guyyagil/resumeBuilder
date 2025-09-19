import { z } from 'zod';

/* ===========================
   Types
   =========================== */

export const welcomeFormSchema = z.object({
  targetJobPosting: z.string().optional(),
});
export type WelcomeFormData = z.infer<typeof welcomeFormSchema>;

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface Experience {
  id?: string;
  company: string;
  title: string;
  duration?: string;
  description: string[];
}

export interface Education {
  id?: string;
  institution: string;
  degree: string;
  duration?: string;
  description: string[];
}

export interface Resume {
  experiences: Experience[];
  skills: string[];
  summary: string;
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  title?: string;
  education: Education[];
}

export interface ResumeDataPatch {
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
    education?: Array<{
      id?: string;
      institution?: string;
      degree?: string;
      duration?: string | null;
      description?: string[] | string | null;
    }>;
  };
  education?: {
    id?: string;
    institution?: string;
    degree?: string;
    duration?: string | null;
    description?: string[] | string | null;
  };
    educations?: Array<{
      id?: string;
      institution?: string;
      degree?: string;
      duration?: string | null;
      description?: string[] | string | null;
    }>;
  updateEducation?: {
    id?: string;
    institution?: string;
    degree?: string;
    duration?: string | null;
    description?: string[] | string | null;
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
  editEducationField?: {
    institution: string;
    field: 'institution' | 'degree' | 'duration';
    newValue: string;
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
  clearSection?: 'experiences' | 'skills' | 'summary' | 'contact' | 'education';
  updateExperienceDescription?: {
    company: string;
    newDescriptions: string[];
  };
}

export interface AppStore {
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

  addOrUpdateEducation: (education: Education) => void;
  removeEducation: (idOrInstitution: string) => void;
  clearAllEducation: () => void;
  replaceAllEducation: (educations: Education[]) => void;

  editEducationField: (institution: string, field: 'institution' | 'degree' | 'duration', newValue: string) => void;
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
  clearSection: (section: 'experiences' | 'skills' | 'summary' | 'contact' | 'education') => void;
  cleanDuplicateDescriptions: () => void;
}

export type RawExperience = {
  id?: string;
  company?: string;
  title?: string;
  duration?: string | null;
  description?: string[] | string | null;
};

export type RawEducation = {
  id?: string;
  institution?: string;
  degree?: string;
  duration?: string | null;
  description?: string[] | string | null;
};