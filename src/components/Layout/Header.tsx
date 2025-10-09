import React from 'react';
import { useAppStore } from '../../store';
import { UndoRedoButtons } from '../Controls/UndoRedoButtons';
import { ExportButton } from '../Controls/ExportButton';
import { NewResumeButton } from '../Controls/NewResumeButton';

export const Header: React.FC = () => {
  const jobDescription = useAppStore(state => state.jobDescription);
  
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">
            AI Resume Optimizer
          </h1>
          
          {jobDescription && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
              Job-Targeted
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <UndoRedoButtons />
          <ExportButton />
          <NewResumeButton />
        </div>
      </div>
    </header>
  );
};