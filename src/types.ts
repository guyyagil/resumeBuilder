export interface ContactInfo {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  title?: string;
}

export interface Experience {
  id?: string;
  company?: string;
  title?: string;
  duration?: string;
  description?: string[];
}

export interface CompleteResume {
  contact?: ContactInfo;
  experiences?: Experience[];
  skills?: string[];
  summary?: string;
}

export type Operation =
  | 'patch'
  | 'replace'
  | 'reset'
  | 'add'
  | 'update'
  | 'remove'
  | 'clear'
  | 'redesign'
  | 'reorganize'
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
  experience?: Experience;
  experiences?: Experience[];
  skills?: string[];
  summary?: string;
  contact?: ContactInfo;
  completeResume?: CompleteResume;
  removeSkills?: string[];
  removeExperiences?: string[];
  clearSections?: string[];
  rewriteExperience?: {
    company: string;
    newDescriptions?: string[];
    newData?: Partial<Experience>;
    reason?: string;
  };
  updateExperienceDescription?: {
    company: string;
    newDescriptions: string[];
  };
  removeDescriptionFromExperience?: {
    company: string;
    descriptionToRemove: string;
  };
  removeDescriptionsFromExperience?: {
    company: string;
    descriptionsToRemove: string[];
  };
  replaceExperience?: {
    company: string;
    newExperience: Experience;
  };

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
    position?: number;
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
    contact?: Partial<ContactInfo>;
  };
  replaceComplete?: CompleteResume;
  clearSection?: 'experiences' | 'skills' | 'summary' | 'contact';
}

export interface NormalizedResumePatch {
  operation: Operation;
  experience?: Experience;
  experiences?: Experience[];
  skills?: string[];
  summary?: string;
  contact?: ContactInfo;
  completeResume?: CompleteResume;
  removeSkills?: string[];
  removeExperiences?: string[];
  clearSections?: string[];
  rewriteExperience?: {
    company: string;
    newDescriptions?: string[];
    newData?: Partial<Experience>;
    reason?: string;
  };
  updateExperienceDescription?: {
    company: string;
    newDescriptions: string[];
  };
  removeDescriptionFromExperience?: {
    company: string;
    descriptionToRemove: string;
  };
  removeDescriptionsFromExperience?: {
    company: string;
    descriptionsToRemove: string[];
  };
  replaceExperience?: {
    company: string;
    newExperience: Experience;
  };

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
    position?: number;
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
    contact?: Partial<ContactInfo>;
  };
  replaceComplete?: CompleteResume;
  clearSection?: 'experiences' | 'skills' | 'summary' | 'contact';
}

// For backward compatibility with store
export interface ResumeDataPatch {
  operation?: Operation;
  experience?: Experience;
  experiences?: Experience[];
  skills?: string[];
  summary?: string;
  contact?: ContactInfo;
  completeResume?: CompleteResume;
  removeSkills?: string[];
  removeExperiences?: string[];
  clearSections?: string[];

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
    position?: number;
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
    contact?: Partial<ContactInfo>;
  };
  replaceComplete?: CompleteResume;
  clearSection?: 'experiences' | 'skills' | 'summary' | 'contact';

  // Legacy operations for backward compatibility
  rewriteExperience?: {
    company: string;
    newDescriptions?: string[];
    newData?: Partial<Experience>;
    reason?: string;
  };
  updateExperienceDescription?: {
    company: string;
    newDescriptions: string[];
  };
  removeDescriptionFromExperience?: {
    company: string;
    descriptionToRemove: string;
  };
  removeDescriptionsFromExperience?: {
    company: string;
    descriptionsToRemove: string[];
  };
  replaceExperience?: {
    company: string;
    newExperience: Experience;
  };
}