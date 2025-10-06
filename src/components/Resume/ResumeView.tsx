// components/Resume/ResumeView.tsx

import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TreeResumeRenderer } from './TreeResumeRenderer';

export const ResumeView: React.FC = () => {
  const { resumeTree } = useAppStore();

  if (resumeTree.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">No resume loaded</p>
          <p className="text-sm">Upload a PDF to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8 bg-white min-h-full">
        <TreeResumeRenderer tree={resumeTree} />
      </div>
    </div>
  );
};
