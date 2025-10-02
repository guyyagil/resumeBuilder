// src/store/useAppStore.new.ts - Fully Dynamic Store
// INSTRUCTIONS: Rename to useAppStore.ts after backing up old one

import { create } from 'zustand';
import type {
  Resume,
  Section,
  ChatAuthor,
  AppStore,
  WelcomeFormData,
  SectionLayout,
} from '../types';

// ============ Helpers ============

const ensureString = (value?: string | null) => value?.trim() ?? '';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const normalizeSection = (section: Section): Section => {
  const base = {
    id: section.id || generateId(),
    key: ensureString(section.key) || generateId(),
    title: section.title,
    layout: section.layout,
    metadata: section.metadata || {},
  };

  switch (section.layout) {
    case 'text':
      return { ...base, layout: 'text', text: ensureString((section as any).text) };
    case 'list':
      return {
        ...base,
        layout: 'list',
        items: Array.isArray((section as any).items) ? (section as any).items : [],
      };
    case 'chips':
      return {
        ...base,
        layout: 'chips',
        chips: Array.isArray((section as any).chips)
          ? (section as any).chips.filter(Boolean)
          : [],
      };
    case 'keyValue':
      return {
        ...base,
        layout: 'keyValue',
        pairs: Array.isArray((section as any).pairs) ? (section as any).pairs : [],
      };
    case 'table':
      return {
        ...base,
        layout: 'table',
        headers: (section as any).headers,
        rows: Array.isArray((section as any).rows) ? (section as any).rows : [],
      };
    case 'custom':
      return { ...base, layout: 'custom', data: (section as any).data };
    default:
      return section;
  }
};

const createInitialResume = (): Resume => ({
  sections: [],
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0',
  },
});

// ============ Store ============

export const useAppStore = create<AppStore>()((set, get) => {
  const pushHistory = () => {
    const current = get().resume;
    set((state) => ({
      resumeHistory: [
        ...state.resumeHistory,
        {
          snapshot: JSON.parse(JSON.stringify(current)),
          timestamp: new Date(),
        },
      ],
    }));
  };

  const updateResume = (updater: (resume: Resume) => Resume) => {
    pushHistory();
    set((state) => ({
      resume: {
        ...updater(state.resume),
        metadata: {
          ...state.resume.metadata,
          updatedAt: new Date(),
        },
      },
    }));
  };

  // Compatibility layer: Convert new sections format to old resume format
  const getCompatibleResume = () => {
    const state = get();
    const sections = state.resume.sections;
    
    // Extract contact info
    const contactSection = sections.find(s => s.key === 'contact' || s.key === 'פרטי התקשרות');
    const contact = contactSection?.layout === 'keyValue' ? 
      Object.fromEntries((contactSection as any).pairs?.map((p: any) => [p.key, p.value]) || []) : {};
    
    // Extract summary
    const summarySection = sections.find(s => s.key === 'summary' || s.key === 'תקציר');
    const summary = summarySection?.layout === 'text' ? (summarySection as any).text : '';
    
    // Extract skills
    const skillsSection = sections.find(s => s.key === 'skills' || s.key === 'כישורים');
    const skills = skillsSection?.layout === 'chips' ? (skillsSection as any).chips : 
                  skillsSection?.layout === 'list' ? (skillsSection as any).items?.map((item: any) => item.title || item.name || item) : [];
    
    // Extract experiences
    const experienceSection = sections.find(s => s.key === 'experience' || s.key === 'ניסיון' || s.key === 'עבודה');
    const experiences = experienceSection?.layout === 'list' ? (experienceSection as any).items || [] : [];
    
    // Extract education
    const educationSection = sections.find(s => s.key === 'education' || s.key === 'השכלה');
    const education = educationSection?.layout === 'list' ? (educationSection as any).items || [] : [];
    
    return {
      fullName: contact.fullName || contact.name || contact['שם מלא'] || '',
      email: contact.email || contact['אימייל'] || '',
      phone: contact.phone || contact['טלפון'] || '',
      location: contact.location || contact.address || contact['כתובת'] || '',
      title: contact.title || contact['תפקיד'] || '',
      summary,
      skills,
      experiences,
      education,
      sections // Keep the new format too
    };
  };

  return {
    // ============ State ============
    currentScreen: 'welcome',
    userBasicInfo: null,
    chatMessages: [],
    resume: createInitialResume(),
    resumeHistory: [],
    targetJobPosting: undefined,
    originalResumeText: undefined,

    // ============ Computed Properties ============
    get compatibleResume() {
      return getCompatibleResume();
    },

    // ============ Chat ============
    addChatMessage(content: string, type: ChatAuthor) {
      set((state) => ({
        chatMessages: [
          ...state.chatMessages,
          {
            id: generateId(),
            type,
            content,
            timestamp: new Date(),
          },
        ],
      }));
    },

    // ============ Navigation ============
    setUserBasicInfo(data: WelcomeFormData) {
      set({ userBasicInfo: data });
    },

    goToChat() {
      set({ currentScreen: 'chat' });
    },

    setTargetJobPosting(text: string) {
      set({ targetJobPosting: text });
    },

    setOriginalResumeText(text: string) {
      set({ originalResumeText: text });
    },

    // ============ History ============
    saveToHistory: pushHistory,

    undo() {
      set((state) => {
        const history = state.resumeHistory;
        if (history.length === 0) return state;

        const previous = history[history.length - 1];
        return {
          resume: previous.snapshot,
          resumeHistory: history.slice(0, -1),
        };
      });
    },

    // ============ Section Operations ============
    
    upsertSection(section: Section) {
      updateResume((resume) => {
        const normalized = normalizeSection(section);
        const existingIndex = resume.sections.findIndex((s) => s.key === normalized.key);

        if (existingIndex >= 0) {
          const updated = [...resume.sections];
          updated[existingIndex] = normalized;
          return { ...resume, sections: updated };
        } else {
          return { ...resume, sections: [...resume.sections, normalized] };
        }
      });
    },

    updateSection(key: string, updates: Partial<Section>) {
      updateResume((resume) => ({
        ...resume,
        sections: resume.sections.map((section) =>
          section.key === key ? normalizeSection({ ...section, ...updates } as Section) : section
        ),
      }));
    },

    removeSection(key: string) {
      updateResume((resume) => ({
        ...resume,
        sections: resume.sections.filter((section) => section.key !== key),
      }));
    },

    replaceSections(sections: Section[]) {
      updateResume((resume) => ({
        ...resume,
        sections: sections.map(normalizeSection),
      }));
    },

    reorderSections(keys: string[]) {
      updateResume((resume) => {
        const sectionMap = new Map(resume.sections.map((s) => [s.key, s]));
        const reordered = keys.map((key) => sectionMap.get(key)).filter(Boolean) as Section[];
        
        // Add any sections not in the keys list at the end
        const remainingSections = resume.sections.filter(
          (s) => !keys.includes(s.key)
        );
        
        return { ...resume, sections: [...reordered, ...remainingSections] };
      });
    },

    appendToSection(key: string, data: any) {
      updateResume((resume) => ({
        ...resume,
        sections: resume.sections.map((section) => {
          if (section.key !== key) return section;

          if (section.layout === 'list' && Array.isArray(data)) {
            return {
              ...section,
              items: [...(section as any).items, ...data],
            };
          } else if (section.layout === 'chips' && Array.isArray(data)) {
            return {
              ...section,
              chips: [...(section as any).chips, ...data],
            };
          } else if (section.layout === 'text' && typeof data === 'string') {
            return {
              ...section,
              text: (section as any).text + ' ' + data,
            };
          }

          return section;
        }),
      }));
    },

    // ============ Utility ============
    
    resetResume() {
      pushHistory();
      set({ resume: createInitialResume() });
    },

    getSection(key: string) {
      return get().resume.sections.find((s) => s.key === key);
    },

    getSectionsByLayout(layout: SectionLayout) {
      return get().resume.sections.filter((s) => s.layout === layout);
    },
  };
});
