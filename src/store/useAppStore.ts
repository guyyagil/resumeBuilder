// useAppStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  AgentAction,
  ResumeNode,
  Numbering,
} from '../types';
import { computeNumbering } from '../utils/numbering';
import { ActionHandler } from '../services/actionHandler';
import { cloneTree, validateTree } from '../utils/treeUtils';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  action?: AgentAction;
};

export type HistoryEntry = {
  id: string;
  tree: ResumeNode[];
  numbering: Numbering;
  timestamp: number;
  description: string;
  action?: AgentAction;
};

type AppPhase = 
  | 'welcome'      // Initial state, showing upload form
  | 'processing'   // Parsing PDF and building tree
  | 'active'       // Main app with resume and chat
  | 'error';       // Error state with retry option

interface AppState {
  // Phase management
  phase: AppPhase;

  // Core data
  resumeTree: ResumeNode[];
  resumeTitle: string;
  numbering: Numbering;
  jobDescription: string;
  textDirection: 'ltr' | 'rtl';
  language: string;
  
  // Chat
  messages: ChatMessage[];
  isProcessing: boolean;
  
  // History (for undo/redo)
  history: HistoryEntry[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Initialization
  isInitializing: boolean;
  initializationError: string | null;
  // Actions
  setPhase: (phase: AppPhase) => void;
  setResumeTree: (tree: ResumeNode[]) => void;
  setResumeTitle: (title: string) => void;
  applyAction: (action: AgentAction, description: string) => void;

  // Initialization
  initializeFromPDF: (file: File, jobDesc: string) => Promise<void>;
  setJobDescription: (desc: string) => void;
  
  // Chat
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setProcessing: (processing: boolean) => void;
  clearChat: () => void;
  
  // History
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Utility
  recomputeNumbering: () => void;
  validateResume: () => string[];
  reset: () => void;
}

const historyEntry = (
  tree: ResumeNode[],
  numbering: Numbering,
  description: string,
  action?: AgentAction,
): HistoryEntry => ({
  id: `history_${Date.now()}`,
  tree: cloneTree(tree),
  numbering: { ...numbering },
  timestamp: Date.now(),
  description,
  action,
});

const initialState = {
  phase: 'welcome' as AppPhase,
  resumeTree: [],
  resumeTitle: '',
  numbering: { addrToUid: {}, uidToAddr: {} },
  jobDescription: '',
  textDirection: 'ltr' as 'ltr' | 'rtl',
  language: 'en',
  messages: [],
  isProcessing: false,
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
  isInitializing: false,
  initializationError: null,
};

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    ...initialState,

    setPhase: (phase) => set((state) => {
      state.phase = phase;
    }),

    setResumeTree: (tree) =>
      set((state) => {
        const errors = validateTree(tree);
        if (errors.length > 0) {
          throw new Error(`Invalid tree structure: ${errors.join(', ')}`);
        }

        state.resumeTree = cloneTree(tree);
        state.numbering = computeNumbering(state.resumeTree);
        state.history = [historyEntry(state.resumeTree, state.numbering, 'Resume loaded')];
        state.historyIndex = 0;
      }),

    setResumeTitle: (title) =>
      set((state) => {
        state.resumeTitle = title;
      }),

    applyAction: (action, description) =>
      set((state) => {
        try {
          console.log('🏪 Store: Before action - tree length:', state.resumeTree.length);
          console.log('🏪 Store: Action:', action);
          
          const handler = new ActionHandler(state.resumeTree, state.numbering);
          const updatedTree = handler.apply(action);

          console.log('🏪 Store: After action - tree length:', updatedTree.length);
          console.log('🏪 Store: Updated tree:', updatedTree);

          state.resumeTree = updatedTree;
          const oldNumbering = { ...state.numbering };
          state.numbering = computeNumbering(state.resumeTree);
          
          console.log('🏪 Store: Old numbering:', oldNumbering);
          console.log('🏪 Store: New numbering:', state.numbering);

          if (state.historyIndex < state.history.length - 1) {
            state.history = state.history.slice(0, state.historyIndex + 1);
          }

          state.history.push(historyEntry(state.resumeTree, state.numbering, description, action));
          state.historyIndex = state.history.length - 1;

          if (state.history.length > state.maxHistorySize) {
            state.history = state.history.slice(-state.maxHistorySize);
            state.historyIndex = state.history.length - 1;
          }
          
          console.log('🏪 Store: Action applied successfully, new tree length:', state.resumeTree.length);
        } catch (error) {
          console.error('Failed to apply action:', error);
          throw error;
        }
      }),

    addMessage: (message) =>
      set((state) => {
        state.messages.push({
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          timestamp: Date.now(),
        });
      }),

    setJobDescription: (description) =>
      set((state) => {
        state.jobDescription = description;
      }),

    setProcessing: (processing) =>
      set((state) => {
        state.isProcessing = processing;
      }),

    clearChat: () =>
      set((state) => {
        state.messages = [];
      }),

    undo: () => {
      const state = get();
      if (!state.canUndo()) return false;

      set((draft) => {
        draft.historyIndex -= 1;
        const entry = draft.history[draft.historyIndex];
        draft.resumeTree = cloneTree(entry.tree);
        draft.numbering = { ...entry.numbering };
      });

      return true;
    },

    redo: () => {
      const state = get();
      if (!state.canRedo()) return false;

      set((draft) => {
        draft.historyIndex += 1;
        const entry = draft.history[draft.historyIndex];
        draft.resumeTree = cloneTree(entry.tree);
        draft.numbering = { ...entry.numbering };
      });

      return true;
    },

    canUndo: () => {
      const state = get();
      return state.historyIndex > 0;
    },

    canRedo: () => {
      const state = get();
      return state.historyIndex < state.history.length - 1;
    },

    recomputeNumbering: () =>
      set((state) => {
        state.numbering = computeNumbering(state.resumeTree);
      }),

    validateResume: () => {
      const state = get();
      return validateTree(state.resumeTree);
    },

    initializeFromPDF: async (file, jobDesc) => {
      set((state) => {
        state.isInitializing = true;
        state.initializationError = null;
        state.phase = 'processing';
        state.jobDescription = jobDesc;
      });
      
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        console.log('API Key loaded:', apiKey ? `${apiKey.substring(0, 10)}...` : 'No API key found');
        
        if (!apiKey) {
          throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
        }
        
        const { PDFProcessor } = await import('../services/pdfProcessor');
        const processor = new PDFProcessor(apiKey);
        const { tree, title, textDirection, language } = await processor.processResume(file);

        console.log('🏪 Store: Setting resumeTitle to:', title);
        console.log('🏪 Store: Title length:', title?.length);
        console.log('🏪 Store: Text direction:', textDirection, 'Language:', language);

        set((state) => {
          state.resumeTree = tree;
          state.resumeTitle = title;
          state.textDirection = textDirection;
          state.language = language;
          state.numbering = computeNumbering(tree);
          state.isInitializing = false;
          state.phase = 'active';
          
          // Initialize history
          const entry: HistoryEntry = {
            id: `history_${Date.now()}`,
            tree: cloneTree(tree),
            numbering: { ...state.numbering },
            timestamp: Date.now(),
            description: 'Resume initialized from PDF'
          };
          
          state.history = [entry];
          state.historyIndex = 0;
          
          // Welcome message
          state.messages.push({
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: `Great! I've analyzed your resume${jobDesc ? ' and the job description' : ''}. I can help you optimize it for maximum impact. What would you like to improve?`,
            timestamp: Date.now()
          });
        });
      } catch (error) {
        set((state) => {
          state.isInitializing = false;
          state.initializationError = (error as Error).message;
          state.phase = 'error';
        });
        throw error;
      }
    },

    reset: () => set(() => ({
      ...initialState,
      phase: 'welcome' as AppPhase
    })),
  })),
);
