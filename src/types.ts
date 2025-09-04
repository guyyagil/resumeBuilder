export interface RawAIResumeData {
  operation?: string;
  experience?: any;
  skills?: string[];
  removeSkills?: string[];
  removeExperiences?: string[];
  clearSections?: string[];
  summary?: string;
  completeResume?: any;
  contact?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    title?: string;
  };
}

export interface NormalizedResumePatch {
  operation: 'patch' | 'replace' | 'reset';
  experience?: {
    id?: string;
    company?: string;
    title?: string;
    duration?: string;
    description?: string[];
  };
  skills?: string[];
  removeSkills?: string[];
  removeExperiences?: string[];
  clearSections?: string[];
  summary?: string;
  completeResume?: any;
  contact?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    title?: string;
  };
}
// src/types/resume.ts
export type ResumeOperation = 'reset' | 'redesign' | 'clear' | 'remove' | 'replace' | 'update' | 'add';

export interface ExperienceInput {
  id?: string;
  company?: string;
  title?: string;
  duration?: string;
  description?: string[];
}

export interface ResumeExperience {
  id?: string;
  company: string;
  title: string;
  duration: string;
  description: string[];
}

export interface CompleteResume {
  experiences?: ResumeExperience[];
  skills?: string[];
  summary?: string;
}

export interface ResumeUpdates {
  operation?: ResumeOperation;
  completeResume?: CompleteResume;
  clearSections?: ('experiences' | 'skills' | 'summary')[];
  removeExperiences?: string[];
  removeSkills?: string[];
  experiences?: ExperienceInput[];
  skills?: string[];
  summary?: string;
  experience?: ExperienceInput;
}

export type AIResponse = string | {
  message: string;
  resumeUpdates?: ResumeUpdates;
};

export type Experience = { company: string; title?: string; duration?: string; description?: string[] };
export type Resume = { experiences?: Experience[]; skills?: string[]; summary?: string; fullName?: string; title?: string };