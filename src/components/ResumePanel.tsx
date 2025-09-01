// src/components/ResumePanel.tsx
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { generateProfessionalSummary, combineSkills } from '../utils/resumeHelpers';
import { printResume } from '../utils/printHelpers';

interface ResumePanelProps {
  userBasicInfo: any;
}

export const ResumePanel: React.FC<ResumePanelProps> = ({ userBasicInfo }) => {
  const { resume } = useAppStore();
  
  const allSkills = combineSkills(userBasicInfo?.keySkills, resume.skills);
  const professionalSummary = generateProfessionalSummary(userBasicInfo, resume.summary);

  return (
    <div id="resume-pane" className="rounded-2xl border border-gray-200 bg-white shadow-lg flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-shrink-0">
        <h1 className="text-lg font-bold text-gray-900">קורות חיים</h1>
        <button
          onClick={() => printResume(resume)}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-medium text-white shadow hover:from-indigo-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
        >
          הדפס \ ייצא PDF
        </button>
      </div>

      {/* Resume Content */}
      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe #f1f5f9' }}>
        {/* Header Section */}
        <div className="text-center border-b border-gray-200 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {resume.fullName?.trim() || 'שם מלא'}
          </h1>
          {resume.title?.trim() && (
            <p className="text-lg text-gray-600 mb-2">{resume.title}</p>
          )}
          <p className="text-sm text-gray-500">
            {[resume.email, resume.phone, resume.location].filter(Boolean).join(' | ')}
          </p>
          {userBasicInfo?.targetJobPosting && (
            <div className="mt-3 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full inline-block">
              🎯 מותאם למשרה המבוקשת
            </div>
          )}
        </div>
        
        {/* Professional Summary */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-200">
            תקציר מקצועי
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed text-justify">
            {professionalSummary}
          </p>
        </div>
        
        {/* Experience Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-200">
            ניסיון
          </h3>
          <div className="space-y-4">
            {resume.experiences.map((exp: any) => (
              <div key={exp.id || exp.company} className="mb-4">
                <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{exp.company} • {exp.duration}</p>
                <div className="text-sm text-gray-700 space-y-1">
                  {exp.description.map((desc: string, index: number) => {
                    const cleanDesc = desc.replace(/^[•\-\s]+/, '');
                    return (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1 text-xs">•</span>
                        <span className="flex-1">{cleanDesc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {resume.experiences.length === 0 && (
              <div className="text-gray-500 text-sm italic text-center py-4">
                <p>ספר לי על הניסיון המקצועי שלך כדי למלא חלק זה</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Skills Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-1 border-b border-gray-200">
            כישורים
          </h2>
          <div className="text-gray-700">
            {allSkills.length > 0 ? (
              <p className="text-sm leading-relaxed">{allSkills.join(' • ')}</p>
            ) : (
              <p className="text-gray-500 text-sm italic text-center py-4 w-full">
                שתף את הכישורים שלך בצ'אט כדי למלא חלק זה
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};