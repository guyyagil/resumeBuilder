import React from 'react';
import { useAppStore } from '../../store';

export const NewResumeButton: React.FC = () => {
  const reset = useAppStore(state => state.reset);
  
  const handleNewResume = () => {
    if (confirm('Are you sure you want to start a new resume? All current changes will be lost.')) {
      reset();
    }
  };
  
  return (
    <button
      onClick={handleNewResume}
      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      <span>New Resume</span>
    </button>
  );
};