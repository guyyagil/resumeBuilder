// src/components/ResumePanel/ResumePanel7.tsx - Elegant Monochrome Style
import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { generateProfessionalSummary, combineSkills, getDisplayExperiences } from '../../utils/resumeHelpers';
import { printResume } from '../../utils/printHelpers';

interface ResumePanel7Props {
  userBasicInfo: any;
}

export const ResumePanel7: React.FC<ResumePanel7Props> = ({ userBasicInfo }) => {
  const { resume } = useAppStore();
  
  const allSkills = combineSkills(userBasicInfo?.keySkills, resume.skills);
  const professionalSummary = generateProfessionalSummary(userBasicInfo, resume.summary);
  
  const displayExperiences = getDisplayExperiences(resume.experiences);

  return (
    <div id="resume-pane" className="h-full flex flex-col resume7-print bg-white">
      <style>{`
        .resume7-preview {
          background: #fff;
          color: #222;
        }
        .resume7-preview h1, 
        .resume7-preview h2, 
        .resume7-preview h3, 
        .resume7-preview h4 {
          color: #111;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .resume7-preview .section-title {
          border-bottom: 2px solid #111;
          padding-bottom: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .resume7-preview .subtitle {
          color: #444;
          font-weight: 500;
        }
        .resume7-preview .text-muted {
          color: #666;
        }
        .resume7-preview .dot {
          background: #111;
          border-radius: 50%;
          width: 0.5rem;
          height: 0.5rem;
          display: inline-block;
          margin-right: 0.5rem;
        }
        .resume7-preview .bordered {
          border: 2px solid #111;
          border-radius: 1rem;
          padding: 1.5rem;
          background: #fff;
        }
        .resume7-preview .desc,
        .resume7-preview .skill,
        .resume7-preview .body-text {
          color: #111 !important;
          font-weight: 400 !important;
        }
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          .resume7-print {
            width: 760px !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            background: #fff !important;
            border: 4px solid #111 !important;
            border-radius: 1rem !important;
            padding: 1rem !important;
            height: auto !important;
            min-height: 0 !important;
            display: block !important;
            overflow: visible !important;
          }
          .resume7-print .grid {
            display: grid !important;
            grid-template-columns: 2fr 3fr !important;
            gap: 1rem !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          .resume7-print .mb-12,
          .resume7-print .mb-8,
          .resume7-print .mb-6 {
            margin-bottom: 0.75rem !important;
          }
          .resume7-print .p-8,
          .resume7-print .p-6 {
            padding: 1rem !important;
          }
        }
      `}</style>
      {/* Print Button */}
      <div className="p-4 border-b border-gray-700 flex justify-end flex-shrink-0">
        <button
          onClick={() => printResume(resume)}
          className="rounded-lg bg-white text-gray-900 px-4 py-2 text-xs font-medium shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
        >
          הדפס \ ייצא PDF
        </button>
      </div>

      {/* Resume Content */}
      <div className="resume7-preview flex-1 overflow-y-auto p-8">
        {/* Header Section */}
        <div className="text-center mb-12 pb-8 section-title">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 border-4 border-black rounded-full flex items-center justify-center bg-white">
                <span className="text-4xl font-bold text-black">
                  {resume.fullName?.trim().split(' ').map(n => n[0]).join('') || 'ש'}
                </span>
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 tracking-wide">{resume.fullName?.trim() || 'שם מלא'}</h1>
          {resume.title?.trim() && (
            <p className="subtitle text-xl mb-6">{resume.title}</p>
          )}
          <div className="flex justify-center gap-8 text-muted text-sm">
            {resume.email && (
              <div className="flex items-center gap-2">
                <span className="dot"></span>
                <span>{resume.email}</span>
              </div>
            )}
            {resume.phone && (
              <div className="flex items-center gap-2">
                <span className="dot"></span>
                <span>{resume.phone}</span>
              </div>
            )}
            {resume.location && (
              <div className="flex items-center gap-2">
                <span className="dot"></span>
                <span>{resume.location}</span>
              </div>
            )}
          </div>
          {userBasicInfo?.targetJobPosting && (
            <div className="mt-6 inline-block px-4 py-1 bordered text-xs uppercase tracking-widest">
              מותאם למשרה המבוקשת
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Left Sidebar */}
          <div className="lg:col-span-2 space-y-10">
            {/* Professional Summary */}
            <div>
              <h2 className="section-title text-2xl">
                תקציר מקצועי
              </h2>
              <p className="body-text leading-relaxed text-justify">
                {professionalSummary}
              </p>
            </div>

            {/* Skills Section */}
            <div>
              <h2 className="section-title text-2xl">
                כישורים
              </h2>
              
              {allSkills.length > 0 ? (
                <div className="space-y-4">
                  {allSkills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-2 h-2 border border-black rotate-45"></div>
                      <span className="skill font-medium">{skill}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted italic font-light">אין כישורים</p>
              )}
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3">
            <h2 className="section-title text-3xl">
              ניסיון מקצועי
            </h2>
            
            <div className="space-y-12">
              {displayExperiences.map((exp: any) => {
                const displayDuration = exp.duration && exp.duration.trim() 
                  ? exp.duration.trim() 
                  : 'תקופת עבודה לא צוינה';
                  
                return (
                  <div key={exp.id || exp.company} className="relative">
                    {/* Elegant separator line */}
                    <div className="absolute right-0 top-0 w-px h-full bg-gradient-to-b from-gray-600 via-gray-700 to-transparent"></div>
                    
                    <div className="mr-8">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-black mb-1">{exp.title}</h3>
                          <p className="subtitle font-medium">{exp.company}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-muted text-sm font-light tracking-wide">
                            {displayDuration}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {exp.description
                          .filter((desc: string) => desc.trim().split(/\s+/).length > 2)
                          .map((desc: string, descIndex: number) => {
                            const cleanDesc = desc.replace(/^[•\-\s]+/, '');
                            return (
                              <div key={descIndex} className="flex items-start gap-4">
                                <div className="w-1 h-1 bg-black rounded-full mt-3 flex-shrink-0"></div>
                                <span className="desc flex-1 leading-relaxed">{cleanDesc}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {displayExperiences.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-2 border-gray-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <span className="text-2xl text-gray-500">💼</span>
                  </div>
                  <p className="text-gray-500 italic font-light">ספר לי על הניסיון המקצועי שלך</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};