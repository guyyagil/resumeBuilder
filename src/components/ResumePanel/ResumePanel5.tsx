// src/components/ResumePanel/ResumePanel5.tsx - Corporate Black Style
import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { generateProfessionalSummary, combineSkills, getDisplayExperiences } from '../../utils/resumeHelpers';
import { printResume } from '../../utils/printHelpers';

interface ResumePanel5Props {
  userBasicInfo: any;
}

export const ResumePanel5: React.FC<ResumePanel5Props> = ({ userBasicInfo }) => {
  const { resume } = useAppStore();
  
  const allSkills = combineSkills(userBasicInfo?.keySkills, resume.skills);
  const professionalSummary = generateProfessionalSummary(userBasicInfo, resume.summary);
  
  const displayExperiences = getDisplayExperiences(resume.experiences);
  const displayEducation = getDisplayExperiences(resume.education || []);

  return (
    <div id="resume-pane" className="h-full flex flex-col resume5-print bg-white">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          .resume5-print {
            width: 760px !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            background: #fff !important;
            border: 2px solid #111 !important;
            border-radius: 1rem !important;
            padding: 1rem !important;
            height: auto !important;
            min-height: 0 !important;
            display: block !important;
            overflow: visible !important;
          }
          .resume5-print .grid {
            display: grid !important;
            grid-template-columns: 1fr 2fr !important;
            gap: 1rem !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          .resume5-print .mb-8,
          .resume5-print .mb-6 {
            margin-bottom: 0.75rem !important;
          }
          .resume5-print .p-8,
          .resume5-print .p-6 {
            padding: 1rem !important;
          }
        }
      `}</style>
      {/* Print Button */}
      <div className="p-4 border-b border-gray-200 flex justify-end flex-shrink-0">
        <button
          onClick={() => printResume(resume)}
          className="rounded-lg bg-gradient-to-r from-gray-800 to-black px-4 py-2 text-xs font-medium text-white shadow hover:from-gray-900 hover:to-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
        >
          הדפס \ ייצא PDF
        </button>
      </div>

      {/* Resume Content */}
      <div className="flex-1 overflow-y-auto p-8" style={{ scrollbarWidth: 'thin', scrollbarColor: '#111 #f5f5f5' }}>
        {/* Header Section - Corporate Style */}
        <div className="bg-white border-t-8 border-gray-900 rounded-lg shadow-xl p-8 mb-8">
          <div className="flex items-center gap-8">
            {/* Profile Image Placeholder */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center shadow-lg">
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
                <p className="text-2xl text-gray-700 font-semibold mb-4">{resume.title}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                {resume.email && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-700 text-sm">📧</span>
                    </div>
                    <span>{resume.email}</span>
                  </div>
                )}
                {resume.phone && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-700 text-sm">📱</span>
                    </div>
                    <span>{resume.phone}</span>
                  </div>
                )}
                {resume.location && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-700 text-sm">📍</span>
                    </div>
                    <span>{resume.location}</span>
                  </div>
                )}
              </div>

              {userBasicInfo?.targetJobPosting && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium">
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
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-gray-900">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">💼</span>
                </div>
                תקציר מקצועי
              </h2>
              <p className="text-gray-700 leading-relaxed text-sm">{professionalSummary}</p>
            </div>

            {/* Education Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🎓</span>
                </div>
                השכלה
              </h2>
              
              {displayEducation.length > 0 ? (
                <div className="space-y-4">
                  {displayEducation.map((edu: any) => (
                    <div key={edu.id || edu.institution}>
                      <h3 className="font-bold text-gray-800">{edu.degree}</h3>
                      <p className="text-sm text-gray-600 font-medium">{edu.institution}</p>
                      {edu.duration && <p className="text-xs text-gray-500">{edu.duration}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">אין מידע על השכלה.</p>
              )}
            </div>

            {/* Skills Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">⚡</span>
                </div>
                כישורים מקצועיים
              </h2>
              
              {allSkills.length > 0 ? (
                <div className="space-y-3">
                  {allSkills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
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
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-black">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
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
                        <div className="w-4 h-4 bg-gray-900 rounded-full border-4 border-white shadow-lg"></div>
                        {index < displayExperiences.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                        )}
                      </div>
                      
                      <div className="mr-8 pb-6">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{exp.title}</h3>
                              <p className="text-gray-700 font-semibold">{exp.company}</p>
                            </div>
                            <span className="bg-gray-200 text-gray-800 text-xs px-3 py-1 rounded-full font-medium">
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
                                    <span className="text-gray-600 mt-1 text-sm">▶</span>
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
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
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