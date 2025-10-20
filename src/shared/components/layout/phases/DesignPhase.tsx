import React from 'react';
import { useAppStore } from '../../../../store';
import { ResumePreview } from '../../../../features/resume/components/ResumePreview';

export const DesignPhase: React.FC = () => {
  const { resumeDesign, phase } = useAppStore();

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

    // DesignAgent already cleaned the HTML and extracted CSS
    // So we can use resumeDesign.html and resumeDesign.css directly
    const cleanHTML = resumeDesign.html;
    const css = resumeDesign.css || '';

    console.log('📄 Download: HTML length:', cleanHTML.length);
    console.log('🎨 Download: CSS length:', css.length);
    console.log('🎨 Download: Template:', resumeDesign.template);
    console.log('📄 Download: HTML preview (first 300 chars):', cleanHTML.substring(0, 300));
    console.log('🎨 Download: CSS preview (first 300 chars):', css.substring(0, 300));

    // Create a new window with just the resume
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the resume');
      return;
    }

    // Detect if content is RTL (Hebrew/Arabic)
    const isRTL = /[\u0590-\u05FF\u0600-\u06FF]/.test(cleanHTML);

    // Write the complete HTML document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html${isRTL ? ' lang="he" dir="rtl"' : ''}>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resume</title>
        <style>
          /* Base reset */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          /* Base container styles */
          body {
            margin: 0;
            padding: 0;
            width: 100%;
            min-height: 100vh;
            background: #f5f5f5;
          }

          .resume-container {
            width: 210mm;
            min-height: 297mm;
            background: white;
            margin: 20px auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }

          /* AI-generated CSS - load in the middle */
          ${css}

          /* CRITICAL OVERRIDES - These MUST come after AI CSS */

          /* Force browsers to print colors - apply to ALL elements */
          html, body, div, span, section, header, footer, aside, main, article,
          h1, h2, h3, h4, h5, h6, p, ul, li, a, img, nav {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Also apply to universal selector */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Print-specific overrides */
          @media print {
            @page {
              size: A4;
              margin: 0;
            }

            /* Force color printing on ALL elements with specific selectors */
            html, body, div, span, section, header, footer, aside, main, article,
            h1, h2, h3, h4, h5, h6, p, ul, li, a, img, nav, table, tr, td, th {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              max-height: none !important;
              overflow: visible !important;
            }

            html {
              height: auto !important;
              overflow: visible !important;
            }

            body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
              min-height: auto !important;
              max-height: none !important;
              overflow: visible !important;
            }

            .resume-container {
              width: 100% !important;
              height: auto !important;
              min-height: auto !important;
              max-height: none !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              page-break-after: auto;
              overflow: visible !important;
            }

            /* Allow sections to break across pages if needed */
            section, .section, div[class*="section"] {
              page-break-inside: auto;
            }

            /* Keep headings with their content */
            h1, h2, h3, h4, h5, h6 {
              page-break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="resume-container">
          ${cleanHTML}
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

  // Only show buttons when design is ready (phase is 'active')
  const showButtons = phase === 'active' && resumeDesign;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-white relative">
      {/* Floating action buttons - only show when design is ready */}
      {showButtons && (
        <div className="absolute top-6 right-8 z-10 flex flex-col space-y-3">
          {/* Regenerate Design */}
          <button
            onClick={handleRegenerateDesign}
            className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-xl hover:shadow-2xl font-medium flex items-center space-x-2"
            title="Regenerate Design"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Regenerate</span>
          </button>

          {/* Download/Print */}
          <button
            onClick={handleDownload}
            className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-xl hover:shadow-2xl font-medium flex items-center space-x-2"
            title="Download PDF"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download</span>
          </button>
        </div>
      )}

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden">
        <ResumePreview />
      </div>
    </div>
  );
};
