import React from 'react';
import { useAppStore } from '../../../store';

export const ResumePreview: React.FC = () => {
  const { resumeDesign, previewMode } = useAppStore();

  if (!resumeDesign) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>Resume preview will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {previewMode === 'html' ? (
        <div 
          className="w-full h-full overflow-auto p-4"
          dangerouslySetInnerHTML={{ __html: resumeDesign.html }}
        />
      ) : (
        <div className="p-4">
          <p className="text-gray-500">Tree view not implemented yet</p>
        </div>
      )}
    </div>
  );
};