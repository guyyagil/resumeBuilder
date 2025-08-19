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
  
  // Simplified actions for AI
  setUserBasicInfo: (data: WelcomeFormData) => void;
  goToChat: () => void;
  addChatMessage: (content: string, type: 'user' | 'ai') => void;
  
  // Resume update actions (simplified for AI)
  updateResume: (updates: Partial<Resume>) => void;
  addOrUpdateExperience: (experience: Experience) => void;
  addSkills: (newSkills: string[]) => void;
  setSummary: (summary: string) => void;
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

  // Simplified resume actions for AI
  updateResume: (updates) =>
    set((state) => ({
      resume: { ...state.resume, ...updates }
    })),

  addOrUpdateExperience: (newExperience) =>
    set((state) => {
      // Check if experience with same company exists
      const existingIndex = state.resume.experiences.findIndex(
        exp => exp.company.toLowerCase() === newExperience.company.toLowerCase()
      );
      
      if (existingIndex !== -1) {
        // Update existing experience
        const updatedExperiences = [...state.resume.experiences];
        updatedExperiences[existingIndex] = {
          ...updatedExperiences[existingIndex],
          ...newExperience,
          // Merge descriptions
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
        // Add new experience
        return {
          resume: {
            ...state.resume,
            experiences: [...state.resume.experiences, newExperience]
          }
        };
      }
    }),

  addSkills: (newSkills) =>
    set((state) => ({
      resume: {
        ...state.resume,
        skills: [...new Set([...state.resume.skills, ...newSkills])]
      }
    })),

  setSummary: (summary) =>
    set((state) => ({
      resume: { ...state.resume, summary }
    })),
}));