// src/types.new.ts - Fully Dynamic Resume System
// NO predefined sections - everything is a dynamic section
// 
// INSTRUCTIONS: Rename this file to types.ts after backing up the old one

export type Identifier = string;

// ============ Dynamic Section System ============

export interface SectionItem {
  id?: Identifier;
  [key: string]: any; // Completely flexible - AI defines structure
}

export interface SectionMeta {
  order?: number;
  pinned?: boolean;
  editable?: boolean;
  aiGenerated?: boolean;
  [key: string]: any;
}

export type SectionLayout = 'text' | 'list' | 'chips' | 'keyValue' | 'table' | 'custom';

export interface BaseSection {
  id?: Identifier;
  key: string; // Unique identifier (e.g., "contact", "work-experience", "skills")
  title?: string; // Display title (e.g., "Contact Info", "Work Experience")
  layout: SectionLayout;
  metadata?: SectionMeta;
}

export interface TextSection extends BaseSection {
  layout: 'text';
  text: string;
}

export interface ListSection extends BaseSection {
  layout: 'list';
  items: SectionItem[];
}

export interface ChipsSection extends BaseSection {
  layout: 'chips';
  chips: string[];
}

export interface KeyValueSection extends BaseSection {
  layout: 'keyValue';
  pairs: Array<{ key: string; value: string }>;
}

export interface TableSection extends BaseSection {
  layout: 'table';
  headers?: string[];
  rows: Array<Record<string, any>>;
}

export interface CustomSection extends BaseSection {
  layout: 'custom';
  data: any; // Completely free-form
}

export type Section =
  | TextSection
  | ListSection
  | ChipsSection
  | KeyValueSection
  | TableSection
  | CustomSection;

// ============ Resume (Just Sections) ============

export interface Resume {
  id?: Identifier;
  sections: Section[]; // Everything is a section!
  metadata?: {
    createdAt?: Date;
    updatedAt?: Date;
    version?: string;
    [key: string]: any;
  };
}

// ============ Chat System ============

export type ChatAuthor = 'user' | 'ai' | 'system';

export interface ChatMessage {
  id: Identifier;
  type: ChatAuthor;
  content: string;
  timestamp: Date | string;
  metadata?: Record<string, unknown>;
}

// ============ App State ============

export interface WelcomeFormData {
  fullName?: string;
  email?: string;
  phone?: string;
  targetJobPosting?: string;
  originalResumeText?: string; // PDF text
}

export interface AppStore {
  // Navigation
  currentScreen: 'welcome' | 'chat';
  userBasicInfo: WelcomeFormData | null;
  
  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (content: string, type: ChatAuthor) => void;
  
  // Resume (Dynamic Sections Only)
  resume: Resume;
  resumeHistory: Array<{ snapshot: Resume; timestamp: Date }>;
  
  // Compatibility layer for old resume format
  compatibleResume: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    title: string;
    summary: string;
    skills: string[];
    experiences: any[];
    education: any[];
    sections: Section[];
  };
  
  // Context
  targetJobPosting?: string;
  originalResumeText?: string;
  
  // Actions
  setUserBasicInfo: (data: WelcomeFormData) => void;
  goToChat: () => void;
  setTargetJobPosting: (text: string) => void;
  setOriginalResumeText: (text: string) => void;
  
  // History
  saveToHistory: () => void;
  undo: () => void;
  
  // Section Operations (Core API)
  upsertSection: (section: Section) => void;
  updateSection: (key: string, updates: Partial<Section>) => void;
  removeSection: (key: string) => void;
  replaceSections: (sections: Section[]) => void;
  reorderSections: (keys: string[]) => void;
  appendToSection: (key: string, data: any) => void;
  
  // Utility
  resetResume: () => void;
  getSection: (key: string) => Section | undefined;
  getSectionsByLayout: (layout: SectionLayout) => Section[];
}

// ============ AI Pipeline Types ============

export interface SectionOperation {
  operation: 'upsert' | 'update' | 'remove' | 'replace' | 'append' | 'reorder';
  section?: Section;
  sections?: Section[];
  key?: string;
  updates?: Partial<Section>;
  data?: any;
  order?: string[];
}

export interface ResumeDataPatch {
  operations: SectionOperation[];
  message?: string;
}

export interface ParsedAIResponse {
  patch?: ResumeDataPatch;
  messageText: string;
  error?: string;
  rawJson?: any;
}
