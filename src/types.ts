export type Operation =
  | 'patch'
  | 'replace'
  | 'reset'
  | 'add'
  | 'update'
  | 'remove'
  | 'clear'
  | 'redesign'
  | 'delete'
  | 'rewrite';

export interface RewriteExperience {
  company: string;
  title?: string;
  duration?: string;
  newDescriptions: string[];
  reason?: string;
}

export interface UpdateExperienceDescription {
  company: string;
  newDescriptions: string[];
  replaceAll?: boolean;
}

export interface RemoveDescriptionFromExperience {
  company: string;
  descriptionToRemove: string;
}

export interface RemoveDescriptionsFromExperience {
  company: string;
  descriptionsToRemove: string[];
}

export interface ReplaceExperience {
  company: string;
  newExperience: {
    id?: string;
    company?: string;
    title?: string;
    duration?: string | null;
    description?: string[] | string | null;
  };
}

// Raw AI output shape (may contain many aliases) - extend with new granular fields
export interface RawAIResumeData {
  operation?: Operation;
  experience?: any;
  experiences?: any[];
  skills?: string[];
  summary?: string;
  contact?: any;
  completeResume?: any;
  removeSkills?: string[];
  removeExperiences?: string[];
  clearSections?: string[];

  // New granular fields that parsers produce/expect
  rewriteExperience?: RewriteExperience;
  updateExperienceDescription?: UpdateExperienceDescription;
  removeDescriptionFromExperience?: RemoveDescriptionFromExperience;
  removeDescriptionsFromExperience?: RemoveDescriptionsFromExperience;
  replaceExperience?: ReplaceExperience;
  // ...other possible raw fields...
}

// Normalized patch used internally
export interface NormalizedResumePatch {
  operation: Operation;
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
  removeSkills?: string[];
  removeExperiences?: string[];
  clearSections?: string[];
  summary?: string;
  contact?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    title?: string;
  };
  completeResume?: any;

  // New granular actions
  rewriteExperience?: RewriteExperience;
  updateExperienceDescription?: UpdateExperienceDescription;
  removeDescriptionFromExperience?: RemoveDescriptionFromExperience;
  removeDescriptionsFromExperience?: RemoveDescriptionsFromExperience;
  replaceExperience?: ReplaceExperience;
  // ...existing normalized fields...
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