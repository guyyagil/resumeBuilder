import { create } from 'zustand';
import { z } from 'zod';

// User form schema
const welcomeFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  location: z.string().optional(),
  currentRole: z.string().min(2, 'Please enter your current role'),
  experienceYears: z.string().optional(),
  industry: z.string().optional(),
  keySkills: z.string().optional(),
});

type WelcomeFormData = z.infer<typeof welcomeFormSchema>;

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

// Simplified data structures for easier AI access
interface Experience {
  company: string;
  title: string;
  duration: string;
  description: string[];
}

interface Resume {
  experiences: Experience[];
  skills: string[];
  summary: string;
}

interface AppStore {
  // App state
  currentScreen: 'welcome' | 'chat';
  
  // User data
  userBasicInfo: WelcomeFormData | null;
  
  // Chat data
  chatMessages: ChatMessage[];
  
  // Simplified resume data
  resume: Resume;
  
  // Basic actions
  setUserBasicInfo: (data: WelcomeFormData) => void;
  goToChat: () => void;
  addChatMessage: (content: string, type: 'user' | 'ai') => void;
  
  // Enhanced resume control actions for AI
  updateResume: (updates: Partial<Resume>) => void;
  
  // Experience management
  addOrUpdateExperience: (experience: Experience) => void;
  removeExperience: (companyName: string) => void;
  clearAllExperiences: () => void;
  replaceAllExperiences: (experiences: Experience[]) => void;
  
  // Skills management
  addSkills: (newSkills: string[]) => void;
  removeSkills: (skillsToRemove: string[]) => void;
  replaceSkills: (newSkills: string[]) => void;
  clearAllSkills: () => void;
  
  // Summary management
  setSummary: (summary: string) => void;
  clearSummary: () => void;
  
  // Complete resume control
  resetResume: () => void;
  replaceEntireResume: (newResume: Resume) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  currentScreen: 'welcome',
  userBasicInfo: null,
  chatMessages: [],
  resume: {
    experiences: [],
    skills: [],
    summary: '',
  },
  
  // Actions
  setUserBasicInfo: (data) => 
    set({ userBasicInfo: data }),
    
  goToChat: () => 
    set({ currentScreen: 'chat' }),
    
  addChatMessage: (content, type) => 
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          id: Date.now().toString(),
          type,
          content,
          timestamp: new Date(),
        },
      ],
    })),

  // Enhanced resume actions for granular AI control
  updateResume: (updates) =>
    set((state) => ({
      resume: { ...state.resume, ...updates }
    })),

  // Experience management
  addOrUpdateExperience: (newExperience) =>
    set((state) => {
      const existingIndex = state.resume.experiences.findIndex(
        exp => exp.company.toLowerCase() === newExperience.company.toLowerCase()
      );
      
      if (existingIndex !== -1) {
        const updatedExperiences = [...state.resume.experiences];
        updatedExperiences[existingIndex] = {
          ...updatedExperiences[existingIndex],
          ...newExperience,
          description: [
            ...new Set([
              ...updatedExperiences[existingIndex].description,
              ...newExperience.description
            ])
          ]
        };
        
        return {
          resume: {
            ...state.resume,
            experiences: updatedExperiences
          }
        };
      } else {
        return {
          resume: {
            ...state.resume,
            experiences: [...state.resume.experiences, newExperience]
          }
        };
      }
    }),

  removeExperience: (companyName) =>
    set((state) => ({
      resume: {
        ...state.resume,
        experiences: state.resume.experiences.filter(
          exp => exp.company.toLowerCase() !== companyName.toLowerCase()
        )
      }
    })),

  clearAllExperiences: () =>
    set((state) => ({
      resume: {
        ...state.resume,
        experiences: []
      }
    })),

  replaceAllExperiences: (experiences) =>
    set((state) => ({
      resume: {
        ...state.resume,
        experiences
      }
    })),

  // Skills management
  addSkills: (newSkills) =>
    set((state) => ({
      resume: {
        ...state.resume,
        skills: [...new Set([...state.resume.skills, ...newSkills])]
      }
    })),

  removeSkills: (skillsToRemove) =>
    set((state) => ({
      resume: {
        ...state.resume,
        skills: state.resume.skills.filter(skill =>
          !skillsToRemove.some(removeSkill =>
            removeSkill.toLowerCase() === skill.toLowerCase()
          )
        )
      }
    })),

  replaceSkills: (newSkills) =>
    set((state) => ({
      resume: {
        ...state.resume,
        skills: newSkills
      }
    })),

  clearAllSkills: () =>
    set((state) => ({
      resume: {
        ...state.resume,
        skills: []
      }
    })),

  // Summary management
  setSummary: (summary) =>
    set((state) => ({
      resume: { ...state.resume, summary }
    })),

  clearSummary: () =>
    set((state) => ({
      resume: {
        ...state.resume,
        summary: ''
      }
    })),

  // Complete resume control
  resetResume: () =>
    set(() => ({
      resume: {
        experiences: [],
        skills: [],
        summary: ''
      }
    })),

  replaceEntireResume: (newResume) =>
    set(() => ({
      resume: newResume
    })),
}));