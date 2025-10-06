import React from 'react';
import { useAppStore } from '../../store/useAppStore';

export const UndoRedoButtons: React.FC = () => {
  const { undo, redo, canUndo, canRedo } = useAppStore();

  return (
    <div className="flex gap-2">
      <button
        onClick={undo}
        disabled={!canUndo()}
        className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-medium text-gray-700 shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Undo
      </button>
      <button
        onClick={redo}
        disabled={!canRedo()}
        className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-medium text-gray-700 shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Redo
      </button>
    </div>
  );
};