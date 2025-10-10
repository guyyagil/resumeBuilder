import React from 'react';
import { useAppStore } from '../../../../store';
import { ManualEditor } from '../../../../features/editing/components/ManualEditor';

export const EditingPhase: React.FC = () => {
  const startDesignPhase = useAppStore(state => state.startDesignPhase);

  const handleGenerateDesign = async () => {
    try {
      await startDesignPhase();
    } catch (error) {
      console.error('Failed to start design phase:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Phase Action Bar */}
      <div className="px-8 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Editing Mode</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <p className="text-sm text-gray-600">
              Click blocks to edit • Select for AI assistance
            </p>
          </div>
          <button
            onClick={handleGenerateDesign}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center space-x-2"
          >
            <span>Generate Design</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        <ManualEditor />
      </div>
    </div>
  );
};
