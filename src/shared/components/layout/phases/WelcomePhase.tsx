import React, { useState } from 'react';
import { ResumeUpload } from '../../../../components/ResumeUpload';
import { useAppStore } from '../../../../store';

export const WelcomePhase: React.FC = () => {
  const [showUploadOption, setShowUploadOption] = useState(false);
  const { initializeBlankResume } = useAppStore();

  const handleStartFromScratch = () => {
    initializeBlankResume();
  };

  if (showUploadOption) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-8">
        <div className="w-full max-w-3xl">
          {/* Main Card */}
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl p-12 border border-blue-100">
            {/* Back Button */}
            <button
              onClick={() => setShowUploadOption(false)}
              className="mb-6 flex items-center space-x-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back</span>
            </button>

            {/* Welcome Header */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                Upload Your Resume
              </h2>
              <p className="text-gray-600 text-lg">
                Upload your resume PDF to optimize it with AI
              </p>
            </div>

            {/* Upload Component */}
            <ResumeUpload />
          </div>

          {/* Simple Feature Pills */}
          <div className="mt-6 flex justify-center space-x-4">
            <div className="flex items-center space-x-2 px-5 py-3 bg-white shadow-lg rounded-full text-sm font-medium text-gray-700 border border-blue-100">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Smart Editing</span>
            </div>
            <div className="flex items-center space-x-2 px-5 py-3 bg-white shadow-lg rounded-full text-sm font-medium text-gray-700 border border-blue-100">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span>AI Design</span>
            </div>
            <div className="flex items-center space-x-2 px-5 py-3 bg-white shadow-lg rounded-full text-sm font-medium text-gray-700 border border-blue-100">
              <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>PDF Export</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-8">
      <div className="w-full max-w-4xl">
        {/* Main Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Create Your Resume
          </h1>
          <p className="text-xl text-gray-600">
            Choose how you'd like to start
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload PDF Option */}
          <button
            onClick={() => setShowUploadOption(true)}
            className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all hover:scale-105 text-left group border border-blue-100"
          >
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center group-hover:from-blue-500 group-hover:to-indigo-600 transition-all shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3 text-center">
              Upload PDF
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Already have a resume? Upload your PDF and optimize it with AI
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Automatic content extraction</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Smart structure recognition</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Quick and easy setup</span>
              </li>
            </ul>
          </button>

          {/* Start from Scratch Option */}
          <button
            onClick={handleStartFromScratch}
            className="bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all hover:scale-105 text-left group border border-purple-100"
          >
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center group-hover:from-purple-500 group-hover:to-pink-600 transition-all shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 text-center">
              Start from Scratch
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Build your resume from the ground up with AI assistance
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Clean template to start with</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>AI-powered content generation</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Full creative control</span>
              </li>
            </ul>
          </button>
        </div>

        {/* Simple Feature Pills */}
        <div className="mt-8 flex justify-center space-x-4">
          <div className="flex items-center space-x-2 px-5 py-3 bg-white shadow-lg rounded-full text-sm font-medium text-gray-700 border border-blue-100">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Smart Editing</span>
          </div>
          <div className="flex items-center space-x-2 px-5 py-3 bg-white shadow-lg rounded-full text-sm font-medium text-gray-700 border border-blue-100">
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <span>AI Design</span>
          </div>
          <div className="flex items-center space-x-2 px-5 py-3 bg-white shadow-lg rounded-full text-sm font-medium text-gray-700 border border-blue-100">
            <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>PDF Export</span>
          </div>
        </div>
      </div>
    </div>
  );
};
