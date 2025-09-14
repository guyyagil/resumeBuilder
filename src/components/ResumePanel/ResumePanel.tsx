// src/components/ResumePanel/ResumePanel.tsx
import React, { useState } from 'react';
import { ResumePanel1 } from './ResumePanel1';
import { ResumePanel2 } from './ResumePanel2';
import { ResumePanel3 } from './ResumePanel3';
import { ResumePanel4 } from './ResumePanel4';
import { ResumePanel5 } from './ResumePanel5';
import { ResumePanel6 } from './ResumePanel6';
import { ResumePanel7 } from './ResumePanel7';
import { ResumePanel8 } from './ResumePanel8';
import { ResumePanel9 } from './ResumePanel9';
import { ResumePanel10 } from './ResumePanel10';

interface ResumePanelProps {
  userBasicInfo: any;
}

// Available resume panel versions
const RESUME_VERSIONS = [
  { id: 1, name: 'קלאסי', component: ResumePanel1 },
  // Modern group
  { id: 2, name: 'מודרני', component: ResumePanel2 },
  { id: 3, name: 'מודרני סגול', component: ResumePanel3 },
  { id: 4, name: 'מודרני ורוד', component: ResumePanel4 },
  { id: 8, name: 'מודרני כחול', component: ResumePanel8 },
  // Elegant
  { id: 7, name: 'אלגנטי שחור-לבן', component: ResumePanel7 },
  // Corporate group
  { id: 5, name: 'שחור עסקי', component: ResumePanel5 },
  { id: 6, name: 'ירוק עסקי', component: ResumePanel6 },
  { id: 9, name: 'כחול עסקי', component: ResumePanel9 },
  { id: 10, name: 'זהב עסקי', component: ResumePanel10 },
] as const;

export const ResumePanel: React.FC<ResumePanelProps> = ({ userBasicInfo }) => {
  const [selectedVersion, setSelectedVersion] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const CurrentPanelComponent = RESUME_VERSIONS.find(v => v.id === selectedVersion)?.component || ResumePanel1;
  const selectedVersionName = RESUME_VERSIONS.find(v => v.id === selectedVersion)?.name || 'קלאסי';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-lg flex flex-col h-[calc(100vh-2rem)]">
      {/* Version Selector Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-shrink-0">
        <h1 className="text-lg font-bold text-gray-900">קורות חיים</h1>

        {/* Template Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">תבנית:</span>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              <span>{selectedVersionName}</span>
              <svg
                className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-1 max-h-60 overflow-y-auto">
                {RESUME_VERSIONS.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => {
                      setSelectedVersion(version.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-right px-4 py-2 text-sm transition-colors ${selectedVersion === version.id
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{version.name}</span>
                      {selectedVersion === version.id && (
                        <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Resume Panel */}
      <div className="flex-1 overflow-hidden">
        <CurrentPanelComponent userBasicInfo={userBasicInfo} />
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};