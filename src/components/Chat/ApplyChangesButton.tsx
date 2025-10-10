import React from 'react';
import { useAppStore } from '../../store';
import { EditingAgent } from '../../features/editing/services/EditingAgent';
import type { EditInstruction } from '../../features/editing/types/editing.types';

interface ApplyChangesButtonProps {
  instructions: EditInstruction[];
  isApplying: boolean;
  onApplyStart: () => void;
  onApplyComplete: () => void;
  onApplyError: () => void;
}

export const ApplyChangesButton: React.FC<ApplyChangesButtonProps> = ({
  instructions,
  isApplying,
  onApplyStart,
  onApplyComplete,
  onApplyError,
}) => {
  const { resumeTree, jobDescription, applyAction, addMessage, regenerateDesign } = useAppStore();

  const handleApplyChanges = async () => {
    if (instructions.length === 0 || isApplying) return;

    onApplyStart();

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      // Create editing agent
      const editingAgent = new EditingAgent(apiKey, {
        maxInstructionsPerBatch: 10,
        prioritizeBySection: true,
        validateBeforeApply: true,
        generateSummary: true,
      });

      // Add processing message
      addMessage({
        role: 'assistant',
        content: `Processing ${instructions.length} editing instructions...`,
      });

      console.log('🔧 Applying batch of', instructions.length, 'instructions');

      // Process the editing batch
      const result = await editingAgent.processEditingBatch(
        instructions,
        resumeTree,
        jobDescription
      );

      console.log('🔧 Editing result:', result);

      if (!result.success) {
        throw new Error(result.summary || 'Failed to process editing instructions');
      }

      // Validate actions before applying
      const { valid: validActions, invalid: invalidActions } = editingAgent.validateActions(
        result.actions,
        resumeTree
      );

      if (invalidActions.length > 0) {
        console.warn('⚠️ Some actions were invalid:', invalidActions);
      }

      // Apply valid actions sequentially
      let appliedCount = 0;
      for (const action of validActions) {
        try {
          applyAction(action, `Batch edit: ${result.summary}`);
          appliedCount++;
        } catch (error) {
          console.error('❌ Failed to apply action:', action, error);
        }
      }

      // Add result message
      const resultMessage = `✅ Applied ${appliedCount} changes successfully!\n\n${result.summary}`;
      
      if (result.warnings && result.warnings.length > 0) {
        const warningsText = result.warnings.join('\n• ');
        addMessage({
          role: 'assistant',
          content: `${resultMessage}\n\n⚠️ Warnings:\n• ${warningsText}`,
        });
      } else {
        addMessage({
          role: 'assistant',
          content: resultMessage,
        });
      }

      // Regenerate design to reflect changes
      console.log('🎨 Regenerating design after batch edit...');
      await regenerateDesign();

      onApplyComplete();
    } catch (error) {
      console.error('❌ Failed to apply changes:', error);
      
      addMessage({
        role: 'assistant',
        content: `❌ Failed to apply changes: ${(error as Error).message}`,
      });

      onApplyError();
    }
  };

  const instructionCount = instructions.length;
  const highPriorityCount = instructions.filter(i => i.priority === 'high').length;

  return (
    <button
      onClick={handleApplyChanges}
      disabled={instructionCount === 0 || isApplying}
      className={`
        flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200
        ${instructionCount === 0 || isApplying
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transform hover:scale-105'
        }
      `}
    >
      {isApplying ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          <span>Applying Changes...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>
            Apply {instructionCount} Change{instructionCount !== 1 ? 's' : ''}
            {highPriorityCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {highPriorityCount} high
              </span>
            )}
          </span>
        </>
      )}
    </button>
  );
};