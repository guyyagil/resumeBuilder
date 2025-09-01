// src/utils/printHelpers.ts
export const printResume = (resume: any) => {
  const source = document.getElementById('resume-pane');
  if (!source) {
    alert('Resume content not found');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    alert('Please allow popups for printing');
    return;
  }

  // Get all existing stylesheets and inline styles
  const allStyles = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(element => {
      if (element.tagName === 'STYLE') {
        return `<style>${element.innerHTML}</style>`;
      } else if (element.tagName === 'LINK') {
        return element.outerHTML;
      }
      return '';
    })
    .join('\n');

  // Enhanced print-specific styles
  const printStyles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      html, body {
        background: white !important;
        color: #111827 !important;
        font-family: 'Heebo', Arial, sans-serif !important;
        direction: rtl !important;
        line-height: 1.5;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      @page {
        size: A4;
        margin: 15mm;
      }
      
      /* Add more print styles here... */
    </style>
  `;

  // Clone and prepare content for printing
  const resumeContent = source.cloneNode(true) as HTMLElement;
  const header = resumeContent.querySelector('.flex.items-center.justify-between');
  if (header) header.remove();
  
  const scrollableContent = resumeContent.querySelector('.flex-1.overflow-y-auto');
  const finalContent = scrollableContent ? scrollableContent.innerHTML : resumeContent.innerHTML;

  // Write complete document
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>קורות חיים - ${resume.fullName || 'Resume'}</title>
      ${allStyles}
      ${printStyles}
    </head>
    <body>
      <div class="print-container">
        ${finalContent}
      </div>
      <script>
        window.addEventListener('load', function() {
          setTimeout(function() {
            window.print();
            window.addEventListener('afterprint', function() {
              window.close();
            });
            setTimeout(function() {
              try { window.close(); } catch(e) {}
            }, 10000);
          }, 300);
        });
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
};