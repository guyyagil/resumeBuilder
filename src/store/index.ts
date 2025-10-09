// Store configuration and exports
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

// Import slices
import { createResumeSlice, type ResumeSlice } from './slices/resumeSlice';
import { createEditingSlice, type EditingSlice } from './slices/editingSlice';
import { createChatSlice, type ChatSlice } from './slices/chatSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';

// Combined store type
export type AppStore = ResumeSlice & EditingSlice & ChatSlice & UISlice;

// Create the store with all slices
export const useAppStore = create<AppStore>()(
  devtools(
    immer((set, get, api) => ({
      ...createResumeSlice(set, get, api),
      ...createEditingSlice(set, get, api),
      ...createChatSlice(set, get, api),
      ...createUISlice(set, get, api),
    })),
    {
      name: 'resume-agent-store',
    }
  )
);

// Export individual slice types for convenience
export type { ResumeSlice, EditingSlice, ChatSlice, UISlice };