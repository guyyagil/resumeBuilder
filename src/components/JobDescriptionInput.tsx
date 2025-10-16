import React, { useState } from 'react';
import { useAppStore } from '../store';

interface JobDescriptionInputProps {
  className?: string;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({ className = '' }) => {
  const { jobDescription, setJobDescription } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(!!jobDescription);
  const [localValue, setLocalValue] = useState(jobDescription);

  const handleSave = () => {
    setJobDescription(localValue);
    if (!localValue.trim()) {
      setIsExpanded(false);
    }
  };

  const handleClear = () => {
    setLocalValue('');
    setJobDescription('');
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setLocalValue(jobDescription); // Reset to saved value
    }
  };

  if (!isExpanded) {
    return (
      <div className={className}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl hover:from-purple-100 hover:to-indigo-100 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-semibold text-purple-900 text-sm">
                  {jobDescription ? 'Job Description Set' : 'Add Job Description'}
                </div>
                <div className="text-xs text-purple-600">
                  {jobDescription
                    ? 'AI will tailor edits to this role'
                    : 'Help AI optimize your resume for a specific job'
                  }
                </div>
              </div>
            </div>
            <svg className="w-5 h-5 text-purple-500 group-hover:text-purple-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={`${className} bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-4 shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-purple-900 text-sm">Target Job Description</h3>
            <p className="text-xs text-purple-600">Paste the job posting to tailor your resume</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsExpanded(false);
            setLocalValue(jobDescription);
          }}
          className="p-1 text-purple-500 hover:text-purple-700 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste the job description here... Include job title, responsibilities, required skills, qualifications, etc."
        className="w-full h-32 px-3 py-2 text-sm border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 resize-none bg-white"
      />

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-purple-600">
          {localValue.length > 0 ? `${localValue.length} characters` : 'No job description yet'}
        </div>
        <div className="flex space-x-2">
          {localValue && (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-all font-medium"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            {jobDescription ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      {jobDescription && localValue === jobDescription && (
        <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-green-800 font-medium">
              AI will now tailor suggestions to this job role
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
