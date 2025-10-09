// Chat system slice
import type { StateCreator } from 'zustand';
import type { ChatMessage, MessageRole } from '../../shared/types';

export interface ChatSlice {
  // Chat state
  messages: ChatMessage[];
  isProcessing: boolean;
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  setProcessing: (processing: boolean) => void;
  
  // Utilities
  getMessagesByRole: (role: MessageRole) => ChatMessage[];
  getRecentMessages: (count: number) => ChatMessage[];
  getConversationHistory: () => Array<{ role: MessageRole; content: string }>;
}

const initialChatState = {
  messages: [] as ChatMessage[],
  isProcessing: false,
};

type AppStore = ChatSlice & any;

export const createChatSlice: StateCreator<AppStore, [["zustand/immer", never]], [], ChatSlice> = (set, get) => ({
  ...initialChatState,

  addMessage: (message) => set((state) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    
    state.messages.push(newMessage);
  }),

  updateMessage: (id, updates) => set((state) => {
    const index = state.messages.findIndex(msg => msg.id === id);
    if (index !== -1) {
      state.messages[index] = { ...state.messages[index], ...updates };
    }
  }),

  removeMessage: (id) => set((state) => {
    state.messages = state.messages.filter(msg => msg.id !== id);
  }),

  clearMessages: () => set((state) => {
    state.messages = [];
  }),

  setProcessing: (processing) => set((state) => {
    state.isProcessing = processing;
  }),

  getMessagesByRole: (role) => {
    const state = get();
    return state.messages.filter(msg => msg.role === role);
  },

  getRecentMessages: (count) => {
    const state = get();
    return state.messages.slice(-count);
  },

  getConversationHistory: () => {
    const state = get();
    return state.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  },
});