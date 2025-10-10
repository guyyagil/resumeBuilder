import React from 'react';
import { useAppStore } from '../../../store';

export const ResumePreview: React.FC = () => {
  const { resumeDesign, isRegeneratingDesign } = useAppStore();

  if (isRegeneratingDesign) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Regenerating Design...</h3>
          <p className="text-gray-600">AI is creating a new design variation</p>
        </div>
      </div>
    );
  }

  if (!resumeDesign) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Design Generated</h3>
          <p className="text-gray-600">Click "Generate Design" to create your resume</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center p-8 bg-gray-100 overflow-auto">
      {/* A4 Paper Container - better proportions */}
      <div
        className="w-full max-w-[210mm] bg-white shadow-2xl my-auto"
        style={{
          minHeight: '297mm',
          aspectRatio: '210/297'
        }}
      >
        {/* AI-Generated Resume HTML */}
        <div
          className="w-full h-full p-12"
          dangerouslySetInnerHTML={{ __html: resumeDesign.html }}
        />
      </div>
    </div>
  );
};