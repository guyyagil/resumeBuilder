import React from 'react';

export const ProcessingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Analyzing your resume...
        </h2>
        <p className="text-gray-600">
          This may take a few moments
        </p>
      </div>
    </div>
  );
};