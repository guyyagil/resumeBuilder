import React from 'react';
import { useAppStore } from '../../../store';

export const LoadingScreen: React.FC = () => {
  const { processingStage } = useAppStore();

  const getStageMessage = (stage: string | null) => {
    switch (stage) {
      case 'extracting':
        return 'Extracting text from your resume...';
      case 'structuring':
        return 'Analyzing resume structure...';
      case 'designing':
        return 'Generating beautiful design...';
      default:
        return 'Processing your resume...';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-8"></div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          {getStageMessage(processingStage)}
        </h2>
        <p className="text-gray-600 max-w-md">
          This may take a few moments as we analyze your resume and create the perfect design.
        </p>
      </div>
    </div>
  );
};