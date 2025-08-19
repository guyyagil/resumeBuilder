import { create } from 'zustand';
import { z } from 'zod';

// Same schema as your components
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

interface Experience {
  id: string;
  title: string;
  company: string;
  duration: string;
  description: string[];
}

interface ResumeData {
  personalInfo: WelcomeFormData | null;
  professionalSummary: string;
  experiences: Experience[];
  skills: string[];
  education: string[];
}

interface AppStore {
  // App state
  currentScreen: 'welcome' | 'chat';
  
  // User data
  userBasicInfo: WelcomeFormData | null;
  
  // Chat data
  chatMessages: ChatMessage[];
  
  // Resume data
  resumeData: ResumeData;
  
  // Actions
  setUserBasicInfo: (data: WelcomeFormData) => void;
  goToChat: () => void;
  addChatMessage: (content: string, type: 'user' | 'ai') => void;
  updateResumeData: (updates: Partial<ResumeData>) => void;
  addExperience: (experience: Experience) => void;
  updateSkills: (skills: string[]) => void;
  updateProfessionalSummary: (summary: string) => void;
  updateExperience: (experienceId: string, updates: Partial<Experience>) => void; // Add this line
}

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  currentScreen: 'welcome',
  userBasicInfo: null,
  chatMessages: [],
  resumeData: {
    personalInfo: null,
    professionalSummary: '',
    experiences: [],
    skills: [],
    education: [],
  },
  
  // Actions
  setUserBasicInfo: (data) => 
    set((state) => ({ 
      userBasicInfo: data,
      resumeData: { ...state.resumeData, personalInfo: data }
    })),
    
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

  updateResumeData: (updates) =>
    set((state) => ({
      resumeData: { ...state.resumeData, ...updates }
    })),

  addExperience: (experience) =>
    set((state) => {
      // Check if experience at same company already exists
      const existingIndex = state.resumeData.experiences.findIndex(
        exp => exp.company.toLowerCase() === experience.company.toLowerCase()
      );
      
      if (existingIndex !== -1) {
        // Update existing experience instead of adding new one
        const updatedExperiences = [...state.resumeData.experiences];
        updatedExperiences[existingIndex] = {
          ...updatedExperiences[existingIndex],
          ...experience,
          // Merge descriptions if both exist
          description: [
            ...new Set([
              ...updatedExperiences[existingIndex].description,
              ...experience.description
            ])
          ]
        };
        
        return {
          resumeData: {
            ...state.resumeData,
            experiences: updatedExperiences
          }
        };
      } else {
        // Add new experience
        return {
          resumeData: {
            ...state.resumeData,
            experiences: [...state.resumeData.experiences, experience]
          }
        };
      }
    }),

  // Add function to update existing experience
  updateExperience: (experienceId: string, updates: Partial<Experience>) =>
    set((state) => ({
      resumeData: {
        ...state.resumeData,
        experiences: state.resumeData.experiences.map(exp =>
          exp.id === experienceId ? { ...exp, ...updates } : exp
        )
      }
    })),

  updateSkills: (skills) =>
    set((state) => ({
      resumeData: { ...state.resumeData, skills }
    })),

  updateProfessionalSummary: (summary) =>
    set((state) => ({
      resumeData: { ...state.resumeData, professionalSummary: summary }
    })),
}));