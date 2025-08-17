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

interface AppStore {
  // App state
  currentScreen: 'welcome' | 'chat';
  
  // User data
  userBasicInfo: WelcomeFormData | null;
  
  // Chat data
  chatMessages: ChatMessage[];
  
  // Actions
  setUserBasicInfo: (data: WelcomeFormData) => void;
  goToChat: () => void;
  addChatMessage: (content: string, type: 'user' | 'ai') => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  currentScreen: 'welcome',
  userBasicInfo: null,
  chatMessages: [],
  
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
}));