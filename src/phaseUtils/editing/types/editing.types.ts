// Editing system types
import type { AgentAction, Priority, Status } from '../../../types';

/**
 * Represents a pending edit instruction from the user
 */
export type EditInstruction = {
  id: string;
  content: string;           // User's instruction text
  timestamp: number;
  status: 'pending' | 'applied' | 'failed';
  targetSection?: string;    // Optional section targeting
  priority?: Priority;
};

/**
 * Collection of edit instructions ready to be processed
 */
export type EditBatch = {
  id: string;
  instructions: EditInstruction[];
  createdAt: number;
  status: Status;
  summary?: string;          // AI-generated summary of changes
};

/**
 * Result from the editing agent
 */
export type EditingResult = {
  success: boolean;
  actions: AgentAction[];
  summary: string;           // Description of what was changed
  appliedInstructions: string[]; // IDs of instructions that were applied
  failedInstructions: string[];  // IDs of instructions that failed
  warnings?: string[];       // Any warnings or notes
};

/**
 * Editing agent configuration
 */
export type EditingAgentConfig = {
  maxInstructionsPerBatch: number;
  prioritizeBySection: boolean;
  validateBeforeApply: boolean;
  generateSummary: boolean;
};

/**
 * Editing queue state
 */
export type EditingQueueState = {
  instructions: EditInstruction[];
  batches: EditBatch[];
  isProcessing: boolean;
  currentBatch?: EditBatch;
};