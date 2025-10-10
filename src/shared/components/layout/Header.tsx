import React from 'react';
import { useAppStore } from '../../../store';

export const Header: React.FC = () => {
  const { resumeTitle, reset, canUndo, canRedo, undo, redo } = useAppStore();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Brand & Title */}
          <div className="flex items-center space-x-4">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {resumeTitle || 'איש איש'}
                </h1>
                <p className="text-xs text-gray-500">
                  AI-Powered Resume Optimizer
                </p>
              </div>
            </div>

            {/* Resume Title Badge (if exists) */}
            {resumeTitle && (
              <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-900">
                  Active Resume
                </span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-4">
            {/* Undo/Redo Group */}
            <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
              <button
                onClick={undo}
                disabled={!canUndo()}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
                title="Undo (Ctrl+Z)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <button
                onClick={redo}
                disabled={!canRedo()}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
                title="Redo (Ctrl+Y)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
                </svg>
              </button>
            </div>

            {/* New Resume Button */}
            <button
              onClick={() => {
                if (resumeTitle && !window.confirm('Start a new resume? Current progress will be lost.')) {
                  return;
                }
                reset();
              }}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>New Resume</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
