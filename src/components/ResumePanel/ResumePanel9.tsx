// src/components/ResumePanel/ResumePanel9.tsx - Corporate Blue Style
import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { generateProfessionalSummary, combineSkills, getDisplayExperiences } from '../../utils/resumeHelpers';
import { printResume } from '../../utils/printHelpers';

interface ResumePanel9Props {
  userBasicInfo: any;
}

export const ResumePanel9: React.FC<ResumePanel9Props> = ({ userBasicInfo }) => {
  const { resume } = useAppStore();
  
  const allSkills = combineSkills(userBasicInfo?.keySkills, resume.skills);
  const professionalSummary = generateProfessionalSummary(userBasicInfo, resume.summary);
  
  const displayExperiences = getDisplayExperiences(resume.experiences);

  return (
    <div id="resume-pane" className="h-full flex flex-col resume9-print bg-white">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          .resume9-print {
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
          .resume9-print .grid {
            display: grid !important;
            grid-template-columns: 1fr 2fr !important;
            gap: 1rem !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          .resume9-print .mb-8,
          .resume9-print .mb-6 {
            margin-bottom: 0.75rem !important;
          }
          .resume9-print .p-8,
          .resume9-print .p-6 {
            padding: 1rem !important;
          }
        }
      `}</style>
      {/* Print Button */}
      <div className="p-4 border-b border-blue-200 flex justify-end flex-shrink-0">
        <button
          onClick={() => printResume(resume)}
          className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-xs font-medium text-white shadow hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
        >
          הדפס \ ייצא PDF
        </button>
      </div>

      {/* Resume Content */}
      <div className="flex-1 overflow-y-auto p-8" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3b82f6 #dbeafe' }}>
        {/* Header Section - Corporate Style */}
        <div className="bg-white border-t-8 border-blue-500 rounded-lg shadow-xl p-8 mb-8">
          <div className="flex items-center gap-8">
            {/* Profile Image Placeholder */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-4xl font-bold text-white">
                  {resume.fullName?.trim().split(' ').map(n => n[0]).join('') || 'ש'}
                </span>
              </div>
            </div>
            
            {/* Header Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {resume.fullName?.trim() || 'שם מלא'}
              </h1>
              {resume.title?.trim() && (
                <p className="text-2xl text-blue-600 font-semibold mb-4">{resume.title}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                {resume.email && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm">📧</span>
                    </div>
                    <span>{resume.email}</span>
                  </div>
                )}
                {resume.phone && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm">📱</span>
                    </div>
                    <span>{resume.phone}</span>
                  </div>
                )}
                {resume.location && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm">📍</span>
                    </div>
                    <span>{resume.location}</span>
                  </div>
                )}
              </div>

              {userBasicInfo?.targetJobPosting && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                  <span>🎯</span>
                  <span>מותאם למשרה המבוקשת</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Summary & Skills */}
          <div className="lg:col-span-1 space-y-6">
            {/* Professional Summary */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">💼</span>
                </div>
                תקציר מקצועי
              </h2>
              <p className="text-gray-700 leading-relaxed text-sm">{professionalSummary}</p>
            </div>

            {/* Skills Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-cyan-500">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">⚡</span>
                </div>
                כישורים מקצועיים
              </h2>
              
              {allSkills.length > 0 ? (
                <div className="space-y-3">
                  {allSkills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-gray-700 text-sm font-medium">{skill}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">אין כישורים</p>
              )}
            </div>
          </div>

          {/* Right Column - Experience */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🚀</span>
                </div>
                ניסיון מקצועי
              </h2>
              
              <div className="space-y-8">
                {displayExperiences.map((exp: any, index: number) => {
                  const displayDuration = exp.duration && exp.duration.trim() 
                    ? exp.duration.trim() 
                    : 'תקופת עבודה לא צוינה';
                    
                  return (
                    <div key={exp.id || exp.company} className="relative">
                      {/* Timeline */}
                      <div className="absolute right-0 top-0 flex flex-col items-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-lg"></div>
                        {index < displayExperiences.length - 1 && (
                          <div className="w-0.5 h-full bg-blue-200 mt-2"></div>
                        )}
                      </div>
                      
                      <div className="mr-8 pb-6">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-100">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{exp.title}</h3>
                              <p className="text-blue-600 font-semibold">{exp.company}</p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                              {displayDuration}
                            </span>
                          </div>
                          
                          <div className="text-gray-700 space-y-2">
                            {exp.description
                              .filter((desc: string) => desc.trim().split(/\s+/).length > 2)
                              .map((desc: string, descIndex: number) => {
                                const cleanDesc = desc.replace(/^[•\-\s]+/, '');
                                return (
                                  <div key={descIndex} className="flex items-start gap-3">
                                    <span className="text-blue-500 mt-1 text-sm">▶</span>
                                    <span className="flex-1 text-sm">{cleanDesc}</span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {displayExperiences.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl">💼</span>
                    </div>
                    <p className="text-gray-500 italic">ספר לי על הניסיון המקצועי שלך</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};