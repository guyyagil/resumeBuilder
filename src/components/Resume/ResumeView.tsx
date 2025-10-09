import React from 'react';
import { useAppStore } from '../../store';
import { TreeResumeRenderer } from './TreeResumeRenderer';
import { HTMLResumeRenderer } from './HTMLResumeRenderer';

export const ResumeView: React.FC = () => {
  const resumeTree = useAppStore((state) => state.resumeTree);
  const resumeTitle = useAppStore((state) => state.resumeTitle);
  const resumeDesign = useAppStore((state) => state.resumeDesign);
  const isRegeneratingDesign = useAppStore((state) => state.isRegeneratingDesign);
  const textDirection = useAppStore((state) => state.textDirection);

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

  // Show the AI-generated HTML design if available
  if (resumeDesign) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50 relative">
        {/* Regenerating indicator */}
        {isRegeneratingDesign && (
          <div className="absolute top-4 right-4 z-10 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-medium">Updating design...</span>
          </div>
        )}
        <HTMLResumeRenderer design={resumeDesign} className="max-w-5xl mx-auto p-6" />
      </div>
    );
  }

  // Fallback to tree renderer if no design is available
  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto p-8" dir={textDirection} style={{ direction: textDirection }}>
        {resumeTitle && (
          <h1 className="text-3xl font-bold text-center mb-8">{resumeTitle}</h1>
        )}
        <TreeResumeRenderer tree={resumeTree} />
      </div>
    </div>
  );
};
