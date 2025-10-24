import React from 'react';
import { useAppStore } from '../../store';

export const ErrorScreen: React.FC = () => {
  const { initializationError, reset } = useAppStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 p-4">
      <div className="max-w-md w-full bg-gradient-to-br from-white to-red-50 rounded-3xl shadow-2xl p-10 text-center border border-red-100">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Something went wrong
        </h2>

        <p className="text-gray-600 mb-8 text-lg">
          {initializationError || 'An unexpected error occurred while processing your resume.'}
        </p>

        <button
          onClick={reset}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};