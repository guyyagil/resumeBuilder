// Manual editing system slice - for user-driven editing (no AI agents)
import type { StateCreator } from 'zustand';

// Simple editing state for manual editing
export interface EditingSlice {
  // Manual editing state
  isEditing: boolean;
  selectedNodeId: string | null;
  
  // Actions
  setEditing: (editing: boolean) => void;
  setSelectedNode: (nodeId: string | null) => void;
}

export const createEditingSlice: StateCreator<any, [["zustand/immer", never]], [], EditingSlice> = (set) => ({
  // Initial state
  isEditing: false,
  selectedNodeId: null,

  // Actions
  setEditing: (editing) => set((state) => {
    state.isEditing = editing;
  }),

  setSelectedNode: (nodeId) => set((state) => {
    state.selectedNodeId = nodeId;
  }),
});