import React from 'react';
import { useAppStore } from '../../store';

export const ResumePreview: React.FC = () => {
  const { resumeDesign, isRegeneratingDesign } = useAppStore();

  if (isRegeneratingDesign) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md px-6">
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl p-12 border border-blue-100">
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto">
                {/* Colorful animated circles */}
                <div className="relative flex items-center justify-center h-full">
                  {/* Outer spinning ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin"></div>
                  {/* Middle spinning ring */}
                  <div className="absolute inset-2 rounded-full border-4 border-cyan-200 border-t-cyan-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                  {/* Inner pulsing dot */}
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full animate-pulse shadow-lg"></div>
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">Regenerating Design...</h3>
            <p className="text-gray-600 text-lg">AI is creating a new design variation</p>
          </div>
        </div>
      </div>
    );
  }

  if (!resumeDesign) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">No Design Generated</h3>
          <p className="text-gray-600 text-lg">Click "Generate Design" to create your resume</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center py-8 px-4 overflow-auto">
      {/* Inject CSS styles for the resume - SAME ORDER AS DOWNLOAD */}
      {resumeDesign.css && (
        <style dangerouslySetInnerHTML={{
          __html: `
            /* AI-generated CSS */
            ${resumeDesign.css}

            /* CRITICAL: Force browsers to show colors - same as download */
            html, body, div, span, section, header, footer, aside, main, article,
            h1, h2, h3, h4, h5, h6, p, ul, li, a, img, nav {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          `
        }} />
      )}

      {/* Dynamic Paper Container - adapts to content size, no fixed dimensions */}
      <div
        className="w-full max-w-[210mm] bg-white shadow-2xl rounded-lg overflow-visible"
        style={{ minHeight: 'auto' }}
      >
        {/* AI-Generated Resume HTML - no padding wrapper, let the AI control spacing */}
        <div
          className="w-full"
          dangerouslySetInnerHTML={{ __html: resumeDesign.html }}
        />
      </div>
    </div>
  );
};