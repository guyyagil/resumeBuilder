// useAppStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ResumeNode, Numbering, AgentAction } from '../types';
import { computeNumbering } from '../utils/numbering';
import { ActionHandler } from '../services/actionHandler';
import { cloneTree, validateTree } from '../utils/treeUtils';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  action?: AgentAction;  // The action that was applied (if any)
};

type HistoryEntry = {
  id: string;
  tree: ResumeNode[];
  numbering: Numbering;
  timestamp: number;
  description: string;  // What changed
  action?: AgentAction;
};

interface AppState {
  // Core data
  resumeTree: ResumeNode[];
  numbering: Numbering;
  
  // Chat
  messages: ChatMessage[];
  jobDescription: string;
  isProcessing: boolean;
  
  // History (for undo/redo)
  history: HistoryEntry[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Actions
  setResumeTree: (tree: ResumeNode[]) => void;
  applyAction: (action: AgentAction, description: string) => void;
  
  // Chat
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setJobDescription: (desc: string) => void;
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
}

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    // Initial state
    resumeTree: [],
    numbering: { addrToUid: {}, uidToAddr: {} },
    messages: [],
    jobDescription: '',
    isProcessing: false,
    history: [],
    historyIndex: -1,
    maxHistorySize: 50,
    
    // Set resume tree and recompute numbering
    setResumeTree: (tree) => set((state) => {
      const errors = validateTree(tree);
      if (errors.length > 0) {
        console.error('Invalid tree:', errors);
        throw new Error(`Invalid tree structure: ${errors.join(', ')}`);
      }
      
      state.resumeTree = cloneTree(tree);
      state.numbering = computeNumbering(state.resumeTree);
      
      // Add to history
      const entry: HistoryEntry = {
        id: `history_${Date.now()}`,
        tree: cloneTree(state.resumeTree),
        numbering: { ...state.numbering },
        timestamp: Date.now(),
        description: 'Resume loaded'
      };
      
      state.history = [entry];
      state.historyIndex = 0;
    }),
    
    // Apply an action and update history
    applyAction: (action, description) => set((state) => {
      // Always recompute numbering before applying action to ensure it's current
      state.numbering = computeNumbering(state.resumeTree);
      const handler = new ActionHandler(state.resumeTree, state.numbering);
      
      try {
        const newTree = handler.apply(action);
        state.resumeTree = newTree;
        state.numbering = computeNumbering(state.resumeTree);
        
        // Add to history
        const entry: HistoryEntry = {
          id: `history_${Date.now()}`,
          tree: cloneTree(state.resumeTree),
          numbering: { ...state.numbering },
          timestamp: Date.now(),
          description,
          action
        };
        
        // Truncate future history if we're not at the end
        if (state.historyIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.historyIndex + 1);
        }
        
        state.history.push(entry);
        state.historyIndex = state.history.length - 1;
        
        // Limit history size
        if (state.history.length > state.maxHistorySize) {
          state.history = state.history.slice(-state.maxHistorySize);
          state.historyIndex = state.history.length - 1;
        }
      } catch (error) {
        console.error('Failed to apply action:', error);
        throw error;
      }
    }),
    
    // Chat actions
    addMessage: (message) => set((state) => {
      state.messages.push({
        ...message,
        id: `msg_${Date.now()}_${Math.random()}`,
        timestamp: Date.now()
      });
    }),
    
    setJobDescription: (desc) => set((state) => {
      state.jobDescription = desc;
    }),
    
    setProcessing: (processing) => set((state) => {
      state.isProcessing = processing;
    }),
    
    clearChat: () => set((state) => {
      state.messages = [];
    }),
    
    // History navigation
    undo: () => {
      const state = get();
      if (!state.canUndo()) return false;
      
      set((draft) => {
        draft.historyIndex--;
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
        draft.historyIndex++;
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
    
    // Utility
    recomputeNumbering: () => set((state) => {
      state.numbering = computeNumbering(state.resumeTree);
    }),
    
    validateResume: () => {
      const state = get();
      return validateTree(state.resumeTree);
    }
  }))
);
