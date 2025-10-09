import React from 'react';
import type { EditInstruction } from '../../features/editing/types/editing.types';

interface EditInstructionCardProps {
  instruction: EditInstruction;
  onRemove: (id: string) => void;
  onUpdatePriority: (id: string, priority: 'low' | 'medium' | 'high') => void;
}

export const EditInstructionCard: React.FC<EditInstructionCardProps> = ({
  instruction,
  onRemove,
  onUpdatePriority,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="Pending" />
        );
      case 'applied':
        return (
          <div className="w-2 h-2 bg-green-400 rounded-full" title="Applied" />
        );
      case 'failed':
        return (
          <div className="w-2 h-2 bg-red-400 rounded-full" title="Failed" />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {getStatusIcon(instruction.status)}
            <span className="text-xs text-gray-500">
              {new Date(instruction.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm text-gray-900 mb-3">{instruction.content}</p>
          
          {/* Priority Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Priority:</span>
            <div className="flex space-x-1">
              {(['low', 'medium', 'high'] as const).map((priority) => (
                <button
                  key={priority}
                  onClick={() => onUpdatePriority(instruction.id, priority)}
                  className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                    instruction.priority === priority
                      ? getPriorityColor(priority)
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Remove Button */}
        <button
          onClick={() => onRemove(instruction.id)}
          className="ml-3 p-1 text-gray-400 hover:text-red-500 transition-colors"
          title="Remove instruction"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};