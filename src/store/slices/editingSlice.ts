// Editing system slice
import type { StateCreator } from 'zustand';
import type { Priority } from '../../types';
import type {
    EditInstruction,
    EditBatch,
    EditingResult,
    EditingQueueState
} from '../../phaseUtils/editing/types/editing.types';

export interface EditingSlice {
    // Editing queue state
    editingQueue: EditingQueueState;

    // Actions
    addEditInstruction: (instruction: Omit<EditInstruction, 'id' | 'timestamp'>) => void;
    removeEditInstruction: (id: string) => void;
    updateEditInstruction: (id: string, updates: Partial<EditInstruction>) => void;
    updateInstructionPriority: (id: string, priority: Priority) => void;
    clearEditInstructions: () => void;

    // Batch operations
    createBatch: (instructionIds: string[]) => string;
    processBatch: (batchId: string) => Promise<EditingResult>;
    setProcessingBatch: (processing: boolean) => void;

    // Queue management
    getPendingInstructions: () => EditInstruction[];
    getInstructionsByPriority: (priority: Priority) => EditInstruction[];
    getQueueStats: () => { total: number; pending: number; applied: number; failed: number };
}

const initialEditingState: EditingQueueState = {
    instructions: [],
    batches: [],
    isProcessing: false,
    currentBatch: undefined,
};

type AppStore = EditingSlice & any;

export const createEditingSlice: StateCreator<AppStore, [["zustand/immer", never]], [], EditingSlice> = (set, get) => ({
    editingQueue: initialEditingState,

    addEditInstruction: (instruction) => set((state) => {
        const newInstruction: EditInstruction = {
            ...instruction,
            id: `edit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            timestamp: Date.now(),
            status: 'pending',
            priority: instruction.priority || 'medium',
        };

        state.editingQueue.instructions.push(newInstruction);
    }),

    removeEditInstruction: (id) => set((state) => {
        state.editingQueue.instructions = state.editingQueue.instructions.filter(
            inst => inst.id !== id
        );
    }),

    updateEditInstruction: (id, updates) => set((state) => {
        const index = state.editingQueue.instructions.findIndex(inst => inst.id === id);
        if (index !== -1) {
            state.editingQueue.instructions[index] = {
                ...state.editingQueue.instructions[index],
                ...updates
            };
        }
    }),

    updateInstructionPriority: (id, priority) => set((state) => {
        const index = state.editingQueue.instructions.findIndex(inst => inst.id === id);
        if (index !== -1) {
            state.editingQueue.instructions[index].priority = priority;
        }
    }),

    clearEditInstructions: () => set((state) => {
        state.editingQueue.instructions = [];
        state.editingQueue.batches = [];
        state.editingQueue.currentBatch = undefined;
    }),

    createBatch: (instructionIds) => {
        const state = get();
        const instructions = state.editingQueue.instructions.filter(
            inst => instructionIds.includes(inst.id)
        );

        const batch: EditBatch = {
            id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            instructions,
            createdAt: Date.now(),
            status: 'pending',
        };

        set((draft) => {
            draft.editingQueue.batches.push(batch);
        });

        return batch.id;
    },

    processBatch: async (batchId) => {
        const state = get();
        const batch = state.editingQueue.batches.find(b => b.id === batchId);

        if (!batch) {
            throw new Error(`Batch ${batchId} not found`);
        }

        set((draft) => {
            draft.editingQueue.isProcessing = true;
            draft.editingQueue.currentBatch = batch;
            batch.status = 'processing';
        });

        try {
            // Import and use editing agent
            // const { EditingAgent } = await import('../../ai');
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

            if (!apiKey) {
                throw new Error('Gemini API key is not configured');
            }

            // const editingAgent = new EditingAgent(apiKey); // TODO: Use this when implementing

            // This would need access to resume data - we'll handle this in the component
            // For now, return a placeholder result
            const result: EditingResult = {
                success: true,
                actions: [],
                summary: 'Batch processed successfully',
                appliedInstructions: batch.instructions.map(i => i.id),
                failedInstructions: [],
            };

            set((draft) => {
                batch.status = 'completed';
                batch.summary = result.summary;

                // Mark instructions as applied
                batch.instructions.forEach(instruction => {
                    const index = draft.editingQueue.instructions.findIndex(i => i.id === instruction.id);
                    if (index !== -1) {
                        draft.editingQueue.instructions[index].status = 'applied';
                    }
                });

                draft.editingQueue.isProcessing = false;
                draft.editingQueue.currentBatch = undefined;
            });

            return result;
        } catch (error) {
            set((draft) => {
                batch.status = 'failed';
                batch.summary = (error as Error).message;

                // Mark instructions as failed
                batch.instructions.forEach(instruction => {
                    const index = draft.editingQueue.instructions.findIndex(i => i.id === instruction.id);
                    if (index !== -1) {
                        draft.editingQueue.instructions[index].status = 'failed';
                    }
                });

                draft.editingQueue.isProcessing = false;
                draft.editingQueue.currentBatch = undefined;
            });

            throw error;
        }
    },

    setProcessingBatch: (processing) => set((state) => {
        state.editingQueue.isProcessing = processing;
    }),

    getPendingInstructions: () => {
        const state = get();
        return state.editingQueue.instructions.filter(inst => inst.status === 'pending');
    },

    getInstructionsByPriority: (priority) => {
        const state = get();
        return state.editingQueue.instructions.filter(inst => inst.priority === priority);
    },

    getQueueStats: () => {
        const state = get();
        const instructions = state.editingQueue.instructions;

        return {
            total: instructions.length,
            pending: instructions.filter(i => i.status === 'pending').length,
            applied: instructions.filter(i => i.status === 'applied').length,
            failed: instructions.filter(i => i.status === 'failed').length,
        };
    },
});