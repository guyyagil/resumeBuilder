// src/components/ResumePanel/ResumePanel2.tsx - Modern Style
import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { generateProfessionalSummary, combineSkills, getDisplayExperiences } from '../../utils/resumeHelpers';
import { printResume } from '../../utils/printHelpers';

interface ResumePanel2Props {
  userBasicInfo: any;
}

export const ResumePanel2: React.FC<ResumePanel2Props> = ({ userBasicInfo }) => {
  const { resume } = useAppStore();

  const allSkills = combineSkills(userBasicInfo?.keySkills, resume.skills);
  const professionalSummary = generateProfessionalSummary(userBasicInfo, resume.summary);

  // Filter out English descriptions for display
  const displayExperiences = getDisplayExperiences(resume.experiences);

  return (
    <div id="resume-pane" className="h-full flex flex-col resume2-print bg-gray-50">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          .resume2-print {
            width: 760px !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            background: #fff !important;
            border: 2px solid #e5e7eb !important;
            border-radius: 1rem !important;
            padding: 1rem !important;
            height: auto !important;
            min-height: 0 !important;
            display: block !important;
            overflow: visible !important;
          }
          .resume2-print .mb-6,
          .resume2-print .mb-4 {
            margin-bottom: 0.75rem !important;
          }
          .resume2-print .p-6 {
            padding: 1rem !important;
          }
        }
      `}</style>

      {/* Print Button */}
      <div className="p-4 border-b border-gray-200 flex justify-end flex-shrink-0">
        <button
          onClick={() => printResume(resume)}
          className="rounded-xl bg-gray-800 px-4 py-2 text-xs font-medium text-white shadow-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all transform hover:scale-105"
        >
          הדפס \ ייצא PDF
        </button>
      </div>

      {/* Resume Content */}
      <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6b7280 #e5e7eb' }}>
        {/* Header Section - Modern Card Style */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200 print:shadow-none print:border-gray-300">
          <div className="text-center print:text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-800">
                  {resume.fullName?.trim().split(' ').map(n => n[0]).join('') || 'ש'}
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {resume.fullName?.trim() || 'שם מלא'}
            </h1>
            {resume.title?.trim() && (
              <p className="text-xl text-gray-600 mb-3 font-medium">{resume.title}</p>
            )}
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              {resume.email && (
                <div className="flex items-center gap-1">
                  <span>📧</span>
                  <span>{resume.email}</span>
                </div>
              )}
              {resume.phone && (
                <div className="flex items-center gap-1">
                  <span>📱</span>
                  <span>{resume.phone}</span>
                </div>
              )}
              {resume.location && (
                <div className="flex items-center gap-1">
                  <span>📍</span>
                  <span>{resume.location}</span>
                </div>
              )}
            </div>
            {userBasicInfo?.targetJobPosting && (
              <div className="mt-4 px-4 py-2 bg-gray-100 text-gray-800 text-sm rounded-full inline-block border border-gray-300">
                🎯 מותאם למשרה המבוקשת
              </div>
            )}
          </div>
        </div>

        {/* Professional Summary - Modern Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">💼</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">תקציר מקצועי</h2>
          </div>
          <p className="text-gray-700 leading-relaxed text-justify">
            {professionalSummary}
          </p>
        </div>

        {/* Experience Section - Modern Cards */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🚀</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">ניסיון מקצועי</h3>
          </div>

          <div className="space-y-6">
            {displayExperiences.map((exp: any, index: number) => {
              const displayDuration = exp.duration && exp.duration.trim()
                ? exp.duration.trim()
                : 'תקופת עבודה לא צוינה';

              return (
                <div key={exp.id || exp.company} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute right-0 top-2 w-3 h-3 bg-gray-400 rounded-full"></div>
                  {/* Timeline line */}
                  {index < displayExperiences.length - 1 && (
                    <div className="absolute right-1.5 top-5 w-0.5 h-full bg-gray-200"></div>
                  )}

                  <div className="mr-8 bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-bold text-gray-900 text-lg">{exp.title}</h4>
                    <p className="text-gray-700 font-medium mb-3">{exp.company} • {displayDuration}</p>
                    <div className="text-gray-700 space-y-2">
                      {exp.description
                        .filter((desc: string) => desc.trim().split(/\s+/).length > 2)
                        .map((desc: string, descIndex: number) => {
                          const cleanDesc = desc.replace(/^[•\-\s]+/, '');
                          return (
                            <div key={descIndex} className="flex items-start gap-3">
                              <span className="text-gray-400 mt-1">▶</span>
                              <span className="flex-1">{cleanDesc}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              );
            })}

            {displayExperiences.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">💼</span>
                </div>
                <p className="text-gray-500 italic">ספר לי על הניסיון המקצועי שלך כדי למלא חלק זה</p>
              </div>
            )}
          </div>
        </div>

        {/* Skills Section - Modern Grid */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">⚡</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">כישורים</h2>
          </div>

          <div className="text-gray-700">
            {allSkills.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {allSkills.map((skill, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 text-gray-800 text-sm font-semibold px-4 py-3 rounded-xl border border-gray-200 text-center hover:bg-gray-200 transition-all"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <p className="text-gray-500 italic">שתף את הכישורים שלך בצ'אט כדי למלא חלק זה</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};