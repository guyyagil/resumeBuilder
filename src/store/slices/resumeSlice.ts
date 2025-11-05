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
} from '../../types';
import type { GeneratedResumeDesign, DesignTemplate, LayoutStructure, ColorScheme } from '../../phaseUtils/design/types/design.types';
import { AddressMap, computeNumbering, cloneTree, generateUid, validateTreeWithConstraints } from '../../utils';
import { ActionHandler } from '../../utils/action-handler';

// Forward declaration for AppStore type
type AppStore = ResumeSlice & any;

export interface ResumeSlice {
  // Phase management
  phase: AppPhase;
  processingStage: ProcessingStage;

  // Core resume data
  originalResumeTree: ResumeNode[]; // Original unmodified tree from upload
  resumeTree: ResumeNode[]; // Current working tree (may be tailored)
  resumeTitle: string;
  numbering: Numbering;
  jobDescription: string;
  textDirection: TextDirection;
  language: string;
  isViewingOriginal: boolean; // Toggle between original and tailored view
  isTailoring: boolean; // AI tailoring in progress
  hasTailoredVersion: boolean; // Track if tailoring has been done at least once

  // Design
  resumeDesign: GeneratedResumeDesign | null;
  isRegeneratingDesign: boolean;
  selectedTemplate: DesignTemplate | null;
  selectedLayout: LayoutStructure | null;
  selectedColorScheme: ColorScheme | null;

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
  setOriginalResumeTree: (tree: ResumeNode[]) => void;
  setResumeTitle: (title: string) => void;
  setJobDescription: (description: string) => void;
  setTextDirection: (direction: TextDirection) => void;
  setLanguage: (language: string) => void;
  setResumeDesign: (design: GeneratedResumeDesign | null) => void;
  setRegeneratingDesign: (regenerating: boolean) => void;
  setSelectedTemplate: (template: DesignTemplate | null) => void;
  setSelectedLayout: (layout: LayoutStructure | null) => void;
  setSelectedColorScheme: (scheme: ColorScheme | null) => void;
  setIsViewingOriginal: (viewing: boolean) => void;
  setIsTailoring: (tailoring: boolean) => void;

  // AI Tailoring
  tailorResumeToJob: (jobDescription: string) => Promise<void>;
  resetToOriginal: () => void;
  
  // Tree operations
  applyAction: (action: AgentAction, description: string) => void;
  applyActions: (actions: AgentAction[]) => void;
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
  initializeBlankResume: () => void;

  // Phase transitions
  startDesignPhase: () => Promise<void>;

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
  originalResumeTree: [],
  resumeTree: [],
  resumeTitle: '',
  numbering: { addrToUid: {}, uidToAddr: {} },
  jobDescription: '',
  textDirection: 'ltr' as TextDirection,
  language: 'en',
  isViewingOriginal: false,
  isTailoring: false,
  hasTailoredVersion: false,
  resumeDesign: null as GeneratedResumeDesign | null,
  isRegeneratingDesign: false,
  selectedTemplate: null as DesignTemplate | null,
  selectedLayout: null as LayoutStructure | null,
  selectedColorScheme: null as ColorScheme | null,
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

  setOriginalResumeTree: (tree) => set((state) => {
    state.originalResumeTree = cloneTree(tree);
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

  setSelectedTemplate: (template) => set((state) => {
    state.selectedTemplate = template;
  }),

  setSelectedLayout: (layout) => set((state) => {
    state.selectedLayout = layout;
  }),

  setSelectedColorScheme: (scheme) => set((state) => {
    state.selectedColorScheme = scheme;
  }),

  setIsViewingOriginal: (viewing) => set((state) => {
    state.isViewingOriginal = viewing;
    // Switch the displayed tree
    if (viewing && state.originalResumeTree.length > 0) {
      // Show original tree without affecting the working tree
      const tempTree = cloneTree(state.originalResumeTree);
      state.numbering = computeNumbering(tempTree);
      state.addressMap = new AddressMap(tempTree);
    } else {
      // Show current working tree
      state.numbering = computeNumbering(state.resumeTree);
      state.addressMap = new AddressMap(state.resumeTree);
    }
  }),

  setIsTailoring: (tailoring) => set((state) => {
    state.isTailoring = tailoring;
  }),

  applyAction: (action, description) => {
    console.log('📝 applyAction called:', { action, description });

    // Apply the action synchronously
    set((state) => {
      try {
        console.log('📊 Current tree nodes:', state.resumeTree.length);
        console.log('📊 Current numbering addresses:', Object.keys(state.numbering.addrToUid));

        const handler = new ActionHandler(state.resumeTree, state.numbering);
        const updatedTree = handler.apply(action);

        state.resumeTree = updatedTree;
        state.numbering = computeNumbering(state.resumeTree);
        state.addressMap = new AddressMap(state.resumeTree);

        console.log('✅ Tree updated, new node count:', state.resumeTree.length);
        console.log('✅ New numbering addresses:', Object.keys(state.numbering.addrToUid));

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
        console.error('❌ Failed to apply action:', error);
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

  applyActions: (actions) => {
    console.log('📝 applyActions called with', actions.length, 'actions');

    // Apply all actions synchronously
    set((state) => {
      try {
        console.log('📊 Current tree nodes:', state.resumeTree.length);

        let currentTree = state.resumeTree;
        let currentNumbering = state.numbering;

        // Apply each action sequentially
        for (const action of actions) {
          const handler = new ActionHandler(currentTree, currentNumbering);
          currentTree = handler.apply(action);
          currentNumbering = computeNumbering(currentTree);
        }

        state.resumeTree = currentTree;
        state.numbering = currentNumbering;
        state.addressMap = new AddressMap(state.resumeTree);

        console.log('✅ All actions applied, new node count:', state.resumeTree.length);

        // Update history
        if (state.historyIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.historyIndex + 1);
        }

        state.history.push(
          createHistoryEntry(
            state.resumeTree,
            state.numbering,
            `Applied ${actions.length} editing action${actions.length > 1 ? 's' : ''}`
          )
        );
        state.historyIndex = state.history.length - 1;

        if (state.history.length > state.maxHistorySize) {
          state.history = state.history.slice(-state.maxHistorySize);
          state.historyIndex = state.history.length - 1;
        }
      } catch (error) {
        console.error('❌ Failed to apply actions:', error);
        throw error;
      }
    });

    // Trigger design regeneration asynchronously after all actions
    setTimeout(() => {
      const { regenerateDesign } = get();
      regenerateDesign().catch(error => {
        console.warn('Design regeneration failed after actions:', error);
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
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in your .env file.');
      }

      // Stage 1: Extract and structure resume
      const currentJobDescription = get().jobDescription;
      set((state) => { state.processingStage = 'structuring'; });
      const { CVProcessingAgent } = await import('../../ai');
      const processor = new CVProcessingAgent(apiKey);
      const { tree, title, textDirection, language } = await processor.processCV(file, currentJobDescription);

      // Complete processing - go directly to editing phase
      set((state) => {
        state.originalResumeTree = cloneTree(tree); // Store original tree
        state.resumeTree = tree;
        state.resumeTitle = title;
        state.textDirection = textDirection;
        state.language = language;
        state.resumeDesign = null; // No design yet - will be generated after editing
        state.numbering = computeNumbering(tree);
        state.addressMap = new AddressMap(tree);
        state.isInitializing = false;
        state.processingStage = null;
        state.phase = 'editing'; // Go to editing phase instead of active

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

  initializeBlankResume: () => {
    // Create a minimal blank resume structure
    const blankTree: ResumeNode[] = [
      {
        uid: generateUid(),
        layout: 'heading',
        title: 'Personal Information',
        style: { level: 1, weight: 'bold' },
        children: [
          {
            uid: generateUid(),
            layout: 'paragraph',
            text: 'Your Name',
            style: { weight: 'bold' }
          },
          {
            uid: generateUid(),
            layout: 'paragraph',
            text: 'Email | Phone | Location'
          }
        ]
      },
      {
        uid: generateUid(),
        layout: 'heading',
        title: 'Summary',
        style: { level: 1, weight: 'bold' },
        children: [
          {
            uid: generateUid(),
            layout: 'paragraph',
            text: 'Professional summary or objective statement'
          }
        ]
      },
      {
        uid: generateUid(),
        layout: 'heading',
        title: 'Experience',
        style: { level: 1, weight: 'bold' },
        children: []
      },
      {
        uid: generateUid(),
        layout: 'heading',
        title: 'Education',
        style: { level: 1, weight: 'bold' },
        children: []
      },
      {
        uid: generateUid(),
        layout: 'heading',
        title: 'Skills',
        style: { level: 1, weight: 'bold' },
        children: []
      }
    ];

    set((state) => {
      state.originalResumeTree = cloneTree(blankTree); // Store original tree
      state.resumeTree = blankTree;
      state.resumeTitle = 'New Resume';
      state.textDirection = 'ltr';
      state.language = 'en';
      state.resumeDesign = null;
      state.numbering = computeNumbering(blankTree);
      state.addressMap = new AddressMap(blankTree);
      state.isInitializing = false;
      state.initializationError = null;
      state.processingStage = null;
      state.phase = 'editing';

      // Initialize history
      const entry = createHistoryEntry(blankTree, state.numbering, 'Blank resume created');
      state.history = [entry];
      state.historyIndex = 0;
    });
  },

  regenerateDesign: async () => {
    const state = get();

    if (!state.resumeDesign) return;

    set((draft) => { draft.isRegeneratingDesign = true; });

    try {
      console.log('🎨 Regenerating design after edit...');

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) return;

      const { DesignAgent } = await import('../../ai');
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

  startDesignPhase: async () => {
    const state = get();

    // Check if layout and color scheme are selected
    if (!state.selectedLayout) {
      throw new Error('No layout selected. Please select a layout first.');
    }
    if (!state.selectedColorScheme) {
      throw new Error('No color scheme selected. Please select a color scheme first.');
    }

    // Transition to designing phase
    set((draft) => {
      draft.phase = 'designing';
      draft.isRegeneratingDesign = true;
    });

    try {
      console.log('🎨 Starting design phase with layout:', state.selectedLayout.name, 'and colors:', state.selectedColorScheme.name);

      // Combine layout and color scheme into a template
      const combinedTemplate: DesignTemplate = {
        id: `${state.selectedLayout.type}_${state.selectedColorScheme.id}`,
        layout: state.selectedLayout,
        colorScheme: state.selectedColorScheme,
        fonts: {
          heading: 'Inter, system-ui, sans-serif',
          body: 'Inter, system-ui, sans-serif',
        },
        // Backward compatibility
        name: state.selectedLayout.name,
        style: 'Custom',
        description: state.selectedLayout.description,
        colors: state.selectedColorScheme.colors,
      };

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      const { DesignAgent } = await import('../../ai');
      const designAgent = new DesignAgent(apiKey);

      const design = await designAgent.generateResumeHTML(
        state.resumeTree,
        state.resumeTitle,
        combinedTemplate,
        state.jobDescription
      );

      console.log('🎨 Design generation completed');

      set((draft) => {
        draft.resumeDesign = design;
        draft.selectedTemplate = combinedTemplate;
        draft.isRegeneratingDesign = false;
        draft.phase = 'active'; // Move to final active phase
      });

    } catch (error) {
      console.error('❌ Failed to generate design:', error);
      set((draft) => {
        draft.isRegeneratingDesign = false;
        draft.phase = 'color-selection'; // Go back to color selection on error
      });
      throw error;
    }
  },

  tailorResumeToJob: async (jobDescription) => {
    const state = get();

    if (!state.originalResumeTree || state.originalResumeTree.length === 0) {
      throw new Error('No original resume tree found. Cannot tailor resume.');
    }

    set((draft) => {
      draft.isTailoring = true;
      draft.jobDescription = jobDescription;
    });

    try {
      console.log('🎯 Starting AI tailoring for job...');

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      const { TailoringAgent } = await import('../../ai/agents/TailoringAgent');
      const tailoringAgent = new TailoringAgent(apiKey);

      // Always tailor based on the original tree, not the current working tree
      const tailoredTree = await tailoringAgent.tailorResumeToJob(
        state.originalResumeTree,
        state.resumeTitle,
        jobDescription
      );

      console.log('✅ Tailoring completed, updating tree...');

      set((draft) => {
        // Clone the tree to ensure it's mutable
        const clonedTree = cloneTree(tailoredTree);

        draft.resumeTree = clonedTree;
        draft.numbering = computeNumbering(clonedTree);
        draft.addressMap = new AddressMap(clonedTree);
        draft.isTailoring = false;
        draft.isViewingOriginal = false;
        draft.hasTailoredVersion = true; // Mark that we now have a tailored version

        // Add to history
        if (draft.historyIndex < draft.history.length - 1) {
          draft.history = draft.history.slice(0, draft.historyIndex + 1);
        }

        draft.history.push(
          createHistoryEntry(
            clonedTree,
            draft.numbering,
            `Tailored resume for target job`
          )
        );
        draft.historyIndex = draft.history.length - 1;

        if (draft.history.length > draft.maxHistorySize) {
          draft.history = draft.history.slice(-draft.maxHistorySize);
          draft.historyIndex = draft.history.length - 1;
        }
      });

    } catch (error) {
      console.error('❌ Failed to tailor resume:', error);
      set((draft) => { draft.isTailoring = false; });
      throw error;
    }
  },

  resetToOriginal: () => set((state) => {
    if (!state.originalResumeTree || state.originalResumeTree.length === 0) {
      console.warn('No original tree to reset to');
      return;
    }

    const originalTree = cloneTree(state.originalResumeTree);
    state.resumeTree = originalTree;
    state.numbering = computeNumbering(originalTree);
    state.addressMap = new AddressMap(originalTree);
    state.isViewingOriginal = false;

    // Add to history
    if (state.historyIndex < state.history.length - 1) {
      state.history = state.history.slice(0, state.historyIndex + 1);
    }

    state.history.push(
      createHistoryEntry(
        originalTree,
        state.numbering,
        'Reset to original resume'
      )
    );
    state.historyIndex = state.history.length - 1;

    if (state.history.length > state.maxHistorySize) {
      state.history = state.history.slice(-state.maxHistorySize);
      state.historyIndex = state.history.length - 1;
    }
  }),

  reset: () => set(() => ({
    ...initialResumeState,
    phase: 'welcome' as AppPhase
  })),
});