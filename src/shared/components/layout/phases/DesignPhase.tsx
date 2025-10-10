import React from 'react';
import { useAppStore } from '../../../../store';
import { ResumePreview } from '../../../../features/resume/components/ResumePreview';

export const DesignPhase: React.FC = () => {
  const { resumeDesign } = useAppStore();

  const handleBackToEditor = () => {
    useAppStore.setState({ phase: 'editing' });
  };

  const handleRegenerateDesign = async () => {
    try {
      const { regenerateDesign } = useAppStore.getState();
      await regenerateDesign();
    } catch (error) {
      console.error('Failed to regenerate design:', error);
    }
  };

  const handleDownload = () => {
    if (!resumeDesign) return;

    // Create a new window with just the resume
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the resume');
      return;
    }

    // Write the complete HTML document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resume</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f5f5;
          }

          .resume-container {
            width: 210mm;
            min-height: 297mm;
            background: white;
            padding: 20mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }

          @media print {
            body {
              background: white;
            }

            .resume-container {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              box-shadow: none;
            }
          }

          ${resumeDesign.css || ''}
        </style>
      </head>
      <body>
        <div class="resume-container">
          ${resumeDesign.html}
        </div>
        <script>
          // Auto-trigger print dialog after page loads
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Phase Action Bar */}
      <div className="px-8 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Design Preview</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <p className="text-sm text-gray-600">
              Review your resume design
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Back to Editor */}
            <button
              onClick={handleBackToEditor}
              className="px-5 py-2.5 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span>Back to Editor</span>
            </button>

            {/* Regenerate Design */}
            <button
              onClick={handleRegenerateDesign}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Regenerate Design</span>
            </button>

            {/* Download/Print */}
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden">
        <ResumePreview />
      </div>
    </div>
  );
};
