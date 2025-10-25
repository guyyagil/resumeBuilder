import React, { useState } from 'react';
import { useAppStore } from '../../store';

interface JobDescriptionInputProps {
  className?: string;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({ className = '' }) => {
  const { jobDescription, setJobDescription, tailorResumeToJob, isTailoring, originalResumeTree } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(!!jobDescription);
  const [localValue, setLocalValue] = useState(jobDescription);
  const [error, setError] = useState<string | null>(null);

  const handleTailorResume = async () => {
    if (!localValue.trim()) {
      setError('Please enter a job description first');
      return;
    }

    if (!originalResumeTree || originalResumeTree.length === 0) {
      setError('No resume to tailor. Please upload a resume first.');
      return;
    }

    setError(null);

    try {
      // Save the job description before tailoring
      setJobDescription(localValue);

      await tailorResumeToJob(localValue);
      // Collapse after successful tailoring
      setIsExpanded(false);
    } catch (err) {
      setError((err as Error).message || 'Failed to tailor resume');
    }
  };

  // Collapse when tailoring starts
  if (isTailoring && isExpanded) {
    setIsExpanded(false);
  }

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
          disabled={isTailoring}
          className={`w-full p-3 border-2 rounded-xl transition-all group ${
            isTailoring
              ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:from-purple-100 hover:to-indigo-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isTailoring ? 'bg-gray-400' : 'bg-purple-500'
              }`}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <div className={`font-semibold text-sm ${isTailoring ? 'text-gray-600' : 'text-purple-900'}`}>
                  {jobDescription ? 'Target Job Set' : 'Add Job Description'}
                </div>
                <div className={`text-xs ${isTailoring ? 'text-gray-500' : 'text-purple-600'}`}>
                  {jobDescription
                    ? 'Click to view or modify'
                    : 'Paste job posting to optimize resume'
                  }
                </div>
              </div>
            </div>
            {!isTailoring && (
              <svg className="w-5 h-5 text-purple-500 group-hover:text-purple-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
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

      <div className="mt-3">
        <div className="text-xs text-purple-600 text-center mb-2">
          {localValue.length > 0 ? `${localValue.length} characters` : 'No job description yet'}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Tailor Resume Button */}
      {localValue.trim() && !isTailoring && (
        <div className="mt-3">
          <button
            onClick={handleTailorResume}
            className="w-full py-3 px-4 rounded-lg font-bold text-sm shadow-lg transition-all bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Tailor Resume to This Job</span>
            </div>
          </button>
          <p className="text-xs text-purple-600 mt-2 text-center">
            AI will optimize your resume specifically for this job posting
          </p>
        </div>
      )}
    </div>
  );
};