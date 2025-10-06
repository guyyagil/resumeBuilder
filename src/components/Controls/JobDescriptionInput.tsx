import React from 'react';
import { useAppStore } from '../../store/useAppStore';

export const JobDescriptionInput: React.FC = () => {
  const { jobDescription, setJobDescription } = useAppStore();

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Target Job Description (Optional)
      </label>
      <textarea
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder="Paste the job description here to get tailored suggestions..."
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows={3}
      />
    </div>
  );
};