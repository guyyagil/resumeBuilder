import React from 'react';
import { useAppStore } from '../store';

export const ErrorScreen: React.FC = () => {
  const error = useAppStore(state => state.initializationError);
  const reset = useAppStore(state => state.reset);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Process Resume
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'An unexpected error occurred'}
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};