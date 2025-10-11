import React from 'react';
import type { EditInstruction } from '../features/editing/types/editing.types';

interface EditInstructionCardProps {
  instruction: EditInstruction;
  onRemove: (id: string) => void;
  onUpdatePriority: (id: string, priority: 'low' | 'medium' | 'high') => void;
}

/**
 * Displays a single edit instruction with priority controls
 */
export const EditInstructionCard: React.FC<EditInstructionCardProps> = ({
  instruction,
  onRemove,
  onUpdatePriority,
}) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'applied':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${getPriorityColor(
        instruction.priority
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getStatusIcon(instruction.status)}</span>
            <span className="text-xs font-medium uppercase tracking-wide">
              {instruction.status}
            </span>
          </div>
          <p className="text-sm leading-relaxed break-words">
            {instruction.content}
          </p>
          {instruction.targetSection && (
            <div className="mt-2 text-xs opacity-75">
              Target: {instruction.targetSection}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {instruction.status === 'pending' && (
            <>
              {/* Priority selector */}
              <select
                value={instruction.priority || 'medium'}
                onChange={(e) =>
                  onUpdatePriority(
                    instruction.id,
                    e.target.value as 'low' | 'medium' | 'high'
                  )
                }
                className="text-xs px-2 py-1 rounded border bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              {/* Remove button */}
              <button
                onClick={() => onRemove(instruction.id)}
                className="text-xs px-2 py-1 rounded bg-white/50 hover:bg-red-100 hover:text-red-800 transition-colors"
                title="Remove instruction"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="mt-2 text-xs opacity-50">
        {new Date(instruction.timestamp).toLocaleString()}
      </div>
    </div>
  );
};
