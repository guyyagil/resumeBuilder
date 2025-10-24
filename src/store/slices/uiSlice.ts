// UI state slice
import type { StateCreator } from 'zustand';
import type { Theme } from '../../types';

export interface UISlice {
  // UI state
  theme: Theme;
  sidebarOpen: boolean;
  activeTab: 'edit' | 'chat';
  showPreview: boolean;
  previewMode: 'tree' | 'html';
  
  // Loading states
  loadingStates: Record<string, boolean>;
  
  // Error states
  errors: Record<string, string | null>;
  
  // Actions
  setTheme: (theme: Theme) => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: 'edit' | 'chat') => void;
  setShowPreview: (show: boolean) => void;
  setPreviewMode: (mode: 'tree' | 'html') => void;
  
  // Loading management
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  
  // Error management
  setError: (key: string, error: string | null) => void;
  getError: (key: string) => string | null;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
  
  // Notifications
  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

const initialUIState = {
  theme: 'light' as Theme,
  sidebarOpen: false,
  activeTab: 'edit' as 'edit' | 'chat',
  showPreview: true,
  previewMode: 'html' as 'tree' | 'html',
  loadingStates: {} as Record<string, boolean>,
  errors: {} as Record<string, string | null>,
};

type AppStore = UISlice & any;

export const createUISlice: StateCreator<AppStore, [["zustand/immer", never]], [], UISlice> = (set, get) => ({
  ...initialUIState,

  setTheme: (theme) => set((state) => {
    state.theme = theme;
  }),

  setSidebarOpen: (open) => set((state) => {
    state.sidebarOpen = open;
  }),

  setActiveTab: (tab) => set((state) => {
    state.activeTab = tab;
  }),

  setShowPreview: (show) => set((state) => {
    state.showPreview = show;
  }),

  setPreviewMode: (mode) => set((state) => {
    state.previewMode = mode;
  }),

  setLoading: (key, loading) => set((state) => {
    state.loadingStates[key] = loading;
  }),

  isLoading: (key) => {
    const state = get();
    return state.loadingStates[key] || false;
  },

  setError: (key, error) => set((state) => {
    state.errors[key] = error;
  }),

  getError: (key) => {
    const state = get();
    return state.errors[key] || null;
  },

  clearError: (key) => set((state) => {
    delete state.errors[key];
  }),

  clearAllErrors: () => set((state) => {
    state.errors = {};
  }),

  showNotification: (message, type = 'info') => {
    // This would integrate with a notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // You could dispatch to a notification library here
    // For example: toast.show({ message, type });
  },
});