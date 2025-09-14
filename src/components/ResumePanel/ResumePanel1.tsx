// src/components/ResumePanel/ResumePanel1.tsx - Classic Style
import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { generateProfessionalSummary, combineSkills, getDisplayExperiences } from '../../utils/resumeHelpers';
import { printResume } from '../../utils/printHelpers';

interface ResumePanel1Props {
  userBasicInfo: any;
}

export const ResumePanel1: React.FC<ResumePanel1Props> = ({ userBasicInfo }) => {
  const { resume } = useAppStore();
  
  const allSkills = combineSkills(userBasicInfo?.keySkills, resume.skills);
  const professionalSummary = generateProfessionalSummary(userBasicInfo, resume.summary);
  
  // Filter out English descriptions for display
  const displayExperiences = getDisplayExperiences(resume.experiences);

  return (
    <div id="resume-pane" className="h-full flex flex-col resume1-print bg-white">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          .resume1-print {
            width: 760px !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            background: #fff !important;
            border: 2px solid #3b82f6 !important;
            border-radius: 1rem !important;
            padding: 1rem !important;
            height: auto !important;
            min-height: 0 !important;
            display: block !important;
            overflow: visible !important;
          }
          .resume1-print .mb-6,
          .resume1-print .mb-4 {
            margin-bottom: 0.75rem !important;
          }
          .resume1-print .p-6 {
            padding: 1rem !important;
          }
        }
      `}</style>
      {/* Print Button */}
      <div className="p-4 border-b border-gray-200 flex justify-end flex-shrink-0">
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
            {displayExperiences.map((exp: any) => {
              // Better duration handling
              const displayDuration = exp.duration && exp.duration.trim() 
                ? exp.duration.trim() 
                : 'תקופת עבודה לא צוינה';
                
              return (
                <div key={exp.id || exp.company} className="mb-4">
                  <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{exp.company} • {displayDuration}</p>
                  <div className="text-sm text-gray-700 space-y-1">
                    {exp.description
                      .filter((desc: string) => desc.trim().split(/\s+/).length > 2) // Only show descriptions with more than 2 words
                      .map((desc: string, index: number) => {
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
              );
            })}
            
            {displayExperiences.length === 0 && (
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
              <div className="flex flex-wrap gap-2">
                {allSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1.5 rounded-md"
                  >
                    {skill}
                  </span>
                ))}
              </div>
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