// Resume data slice
import type { StateCreator } from 'zustand';
import type { 
  ResumeNode, 
  Numbering, 
  HistoryEntry, 
  AgentAction,
  AppPhase,
  ProcessingStage,
  TextDirection
} from '../../shared/types';
import type { GeneratedResumeDesign } from '../../features/design/types/design.types';
import { AddressMap } from '../../shared/utils/tree/addressMap';
import { computeNumbering } from '../../shared/utils/tree/numbering';
import { cloneTree } from '../../shared/utils/tree/treeUtils';
import { validateTreeWithConstraints } from '../../shared/utils/validation/resumeValidator';
import { ActionHandler } from '../../services/actionHandler';

// Forward declaration for AppStore type
type AppStore = ResumeSlice & any;

export interface ResumeSlice {
  // Phase management
  phase: AppPhase;
  processingStage: ProcessingStage;
  
  // Core resume data
  resumeTree: ResumeNode[];
  resumeTitle: string;
  numbering: Numbering;
  jobDescription: string;
  textDirection: TextDirection;
  language: string;
  
  // Design
  resumeDesign: GeneratedResumeDesign | null;
  isRegeneratingDesign: boolean;
  
  // Fast lookups
  addressMap: AddressMap | null;
  
  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Initialization state
  isInitializing: boolean;
  initializationError: string | null;
  
  // Actions
  setPhase: (phase: AppPhase) => void;
  setProcessingStage: (stage: ProcessingStage) => void;
  setResumeTree: (tree: ResumeNode[]) => void;
  setResumeTitle: (title: string) => void;
  setJobDescription: (description: string) => void;
  setTextDirection: (direction: TextDirection) => void;
  setLanguage: (language: string) => void;
  setResumeDesign: (design: GeneratedResumeDesign | null) => void;
  setRegeneratingDesign: (regenerating: boolean) => void;
  
  // Tree operations
  applyAction: (action: AgentAction, description: string) => void;
  getNodeByAddress: (address: string) => ResumeNode | undefined;
  recomputeNumbering: () => void;
  rebuildAddressMap: () => void;
  
  // History operations
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Initialization
  initializeFromPDF: (file: File, jobDesc: string) => Promise<void>;
  
  // Design regeneration
  regenerateDesign: () => Promise<void>;
  
  // Validation
  validateResume: () => string[];
  
  // Reset
  reset: () => void;
}

const createHistoryEntry = (
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

const initialResumeState = {
  phase: 'welcome' as AppPhase,
  processingStage: null as ProcessingStage,
  resumeTree: [],
  resumeTitle: '',
  numbering: { addrToUid: {}, uidToAddr: {} },
  jobDescription: '',
  textDirection: 'ltr' as TextDirection,
  language: 'en',
  resumeDesign: null as GeneratedResumeDesign | null,
  isRegeneratingDesign: false,
  addressMap: null as AddressMap | null,
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
  isInitializing: false,
  initializationError: null,
};

export const createResumeSlice: StateCreator<AppStore, [["zustand/immer", never]], [], ResumeSlice> = (set, get) => ({
  ...initialResumeState,

  setPhase: (phase) => set((state) => {
    state.phase = phase;
  }),

  setProcessingStage: (stage) => set((state) => {
    state.processingStage = stage;
  }),

  setResumeTree: (tree) => set((state) => {
    const errors = validateTreeWithConstraints(tree);
    if (!errors.isValid && errors.errors.length > 0) {
      throw new Error(`Invalid tree structure: ${errors.errors.map(e => e.message).join(', ')}`);
    }

    state.resumeTree = cloneTree(tree);
    state.numbering = computeNumbering(state.resumeTree);
    state.addressMap = new AddressMap(state.resumeTree);
    state.history = [createHistoryEntry(state.resumeTree, state.numbering, 'Resume loaded')];
    state.historyIndex = 0;
  }),

  setResumeTitle: (title) => set((state) => {
    state.resumeTitle = title;
  }),

  setJobDescription: (description) => set((state) => {
    state.jobDescription = description;
  }),

  setTextDirection: (direction) => set((state) => {
    state.textDirection = direction;
  }),

  setLanguage: (language) => set((state) => {
    state.language = language;
  }),

  setResumeDesign: (design) => set((state) => {
    state.resumeDesign = design;
  }),

  setRegeneratingDesign: (regenerating) => set((state) => {
    state.isRegeneratingDesign = regenerating;
  }),

  applyAction: (action, description) => {
    // Apply the action synchronously
    set((state) => {
      try {
        const handler = new ActionHandler(state.resumeTree, state.numbering);
        const updatedTree = handler.apply(action);

        state.resumeTree = updatedTree;
        state.numbering = computeNumbering(state.resumeTree);
        state.addressMap = new AddressMap(state.resumeTree);

        // Update history
        if (state.historyIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.historyIndex + 1);
        }

        state.history.push(createHistoryEntry(state.resumeTree, state.numbering, description, action));
        state.historyIndex = state.history.length - 1;

        if (state.history.length > state.maxHistorySize) {
          state.history = state.history.slice(-state.maxHistorySize);
          state.historyIndex = state.history.length - 1;
        }
      } catch (error) {
        console.error('Failed to apply action:', error);
        throw error;
      }
    });

    // Trigger design regeneration asynchronously after the action
    setTimeout(() => {
      const { regenerateDesign } = get();
      regenerateDesign().catch(error => {
        console.warn('Design regeneration failed after action:', error);
      });
    }, 100); // Small delay to ensure state is updated
  },

  getNodeByAddress: (address) => {
    const state = get();
    return state.addressMap?.get(address);
  },

  recomputeNumbering: () => set((state) => {
    state.numbering = computeNumbering(state.resumeTree);
    state.addressMap = new AddressMap(state.resumeTree);
  }),

  rebuildAddressMap: () => set((state) => {
    state.addressMap = new AddressMap(state.resumeTree);
  }),

  undo: () => {
    const state = get();
    if (!state.canUndo()) return false;

    set((draft) => {
      draft.historyIndex -= 1;
      const entry = draft.history[draft.historyIndex];
      draft.resumeTree = cloneTree(entry.tree);
      draft.numbering = { ...entry.numbering };
      draft.addressMap = new AddressMap(draft.resumeTree);
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
      draft.addressMap = new AddressMap(draft.resumeTree);
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

  initializeFromPDF: async (file, jobDesc) => {
    set((state) => {
      state.isInitializing = true;
      state.initializationError = null;
      state.phase = 'processing';
      state.processingStage = 'extracting';
      state.jobDescription = jobDesc;
    });

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
      if (!apiKey) {
        throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
      }

      // Stage 1: Extract and structure resume
      set((state) => { state.processingStage = 'structuring'; });
      const { SimplePDFProcessor } = await import('../../shared/services/pdf/PDFProcessor');
      const processor = new SimplePDFProcessor(apiKey);
      const { tree, title, textDirection, language } = await processor.processResume(file);

      // Stage 2: Generate design
      set((state) => { state.processingStage = 'designing'; });
      const { DesignAgent } = await import('../../features/design/services/DesignAgent');
      const { selectDesignTemplate } = await import('../../features/design/templates');

      const designAgent = new DesignAgent(apiKey);
      const resumeText = JSON.stringify(tree);
      const selectedTemplate = selectDesignTemplate(resumeText, jobDesc);
      const design = await designAgent.generateResumeHTML(tree, title, selectedTemplate, jobDesc);

      set((state) => {
        state.resumeTree = tree;
        state.resumeTitle = title;
        state.textDirection = textDirection;
        state.language = language;
        state.resumeDesign = design;
        state.numbering = computeNumbering(tree);
        state.addressMap = new AddressMap(tree);
        state.isInitializing = false;
        state.processingStage = null;
        state.phase = 'active';

        // Initialize history
        const entry = createHistoryEntry(tree, state.numbering, 'Resume initialized from PDF');
        state.history = [entry];
        state.historyIndex = 0;
      });
    } catch (error) {
      set((state) => {
        state.isInitializing = false;
        state.initializationError = (error as Error).message;
        state.phase = 'error';
        state.processingStage = null;
      });
      throw error;
    }
  },

  regenerateDesign: async () => {
    const state = get();

    if (!state.resumeDesign) return;

    set((draft) => { draft.isRegeneratingDesign = true; });

    try {
      console.log('🎨 Regenerating design after edit...');

      const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
      if (!apiKey) return;

      const { DesignAgent } = await import('../../features/design/services/DesignAgent');
      const designAgent = new DesignAgent(apiKey);

      const design = await designAgent.generateResumeHTML(
        state.resumeTree,
        state.resumeTitle,
        state.resumeDesign.template,
        state.jobDescription
      );

      set((draft) => {
        draft.resumeDesign = design;
        draft.isRegeneratingDesign = false;
      });

      console.log('✅ Design regenerated successfully');
    } catch (error) {
      console.error('❌ Failed to regenerate design:', error);
      set((draft) => { draft.isRegeneratingDesign = false; });
    }
  },

  validateResume: () => {
    const state = get();
    const result = validateTreeWithConstraints(state.resumeTree);
    return result.errors.map(e => `${e.path}: ${e.message}`);
  },

  reset: () => set(() => ({
    ...initialResumeState,
    phase: 'welcome' as AppPhase
  })),
});