import React from 'react';
import type { EditInstruction } from '../../phaseUtils/editing/types/editing.types';
import { EditingAgent } from '../../ai';
import { useAppStore } from '../../store';

interface ApplyChangesButtonProps {
  instructions: EditInstruction[];
  isApplying: boolean;
  onApplyStart: () => void;
  onApplyComplete: () => void;
  onApplyError: () => void;
}

/**
 * Button component that applies a batch of editing instructions to the resume
 */
export const ApplyChangesButton: React.FC<ApplyChangesButtonProps> = ({
  instructions,
  isApplying,
  onApplyStart,
  onApplyComplete,
  onApplyError,
}) => {
  const { resumeTree, jobDescription, applyActions, addMessage } = useAppStore();

  const handleApplyChanges = async () => {
    if (instructions.length === 0 || isApplying) return;

    onApplyStart();

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      // Initialize the editing agent
      const editingAgent = new EditingAgent(apiKey);

      // Add status message
      addMessage({
        role: 'assistant',
        content: `Processing ${instructions.length} editing instruction${
          instructions.length > 1 ? 's' : ''
        }...`,
      });

      // Process the batch of instructions
      const result = await editingAgent.processEditingBatch(
        instructions,
        resumeTree,
        jobDescription
      );

      console.log('📝 EditingAgent result:', result);

      // Apply the actions to the resume tree
      if (result.actions.length > 0) {
        applyActions(result.actions);
      }

      // Add result message
      addMessage({
        role: 'assistant',
        content: result.summary,
      });

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        addMessage({
          role: 'assistant',
          content: `⚠️ Warnings:\n${result.warnings.join('\n')}`,
        });
      }

      // Show failed instructions if any
      if (result.failedInstructions.length > 0) {
        addMessage({
          role: 'assistant',
          content: `❌ Failed to apply ${result.failedInstructions.length} instruction${
            result.failedInstructions.length > 1 ? 's' : ''
          }`,
        });
      }

      onApplyComplete();
    } catch (error) {
      console.error('Failed to apply changes:', error);
      addMessage({
        role: 'assistant',
        content: `Failed to apply changes: ${(error as Error).message}`,
      });
      onApplyError();
    }
  };

  return (
    <button
      onClick={handleApplyChanges}
      disabled={isApplying || instructions.length === 0}
      className="px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
    >
      {isApplying ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Applying Changes...</span>
        </>
      ) : (
        <>
          <span>✨</span>
          <span>
            Apply {instructions.length} Change{instructions.length > 1 ? 's' : ''}
          </span>
        </>
      )}
    </button>
  );
};