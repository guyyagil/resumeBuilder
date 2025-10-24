import React from 'react';
import type { EditInstruction } from '../../phaseUtils/editing/types/editing.types';

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
        return 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-lg';
      case 'medium':
        return 'bg-gradient-to-r from-blue-400 to-blue-500 text-white border-blue-400 shadow-md';
      case 'low':
        return 'bg-gradient-to-r from-blue-200 to-blue-300 text-blue-900 border-blue-200';
      default:
        return 'bg-gradient-to-r from-blue-200 to-blue-300 text-blue-900 border-blue-200';
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
      className={`p-4 rounded-xl border-2 transition-all ${getPriorityColor(
        instruction.priority
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getStatusIcon(instruction.status)}</span>
            <span className={`text-xs font-bold uppercase tracking-wide ${
              instruction.priority === 'low' ? 'text-blue-900' : 'text-white'
            }`}>
              {instruction.status}
            </span>
          </div>
          <p className={`text-sm leading-relaxed break-words font-medium ${
            instruction.priority === 'low' ? 'text-blue-900' : 'text-white'
          }`}>
            {instruction.content}
          </p>
          {instruction.targetSection && (
            <div className={`mt-2 text-xs ${
              instruction.priority === 'low' ? 'text-blue-700' : 'text-white/80'
            }`}>
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
                className="text-xs px-2 py-1 rounded-lg border-2 border-white bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 font-semibold text-blue-700"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              {/* Remove button */}
              <button
                onClick={() => onRemove(instruction.id)}
                className="text-xs px-2 py-1 rounded-lg bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-900 transition-all font-semibold border-2 border-white"
                title="Remove instruction"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className={`mt-2 text-xs ${
        instruction.priority === 'low' ? 'text-blue-600' : 'text-white/70'
      }`}>
        {new Date(instruction.timestamp).toLocaleString()}
      </div>
    </div>
  );
};