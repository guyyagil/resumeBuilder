// src/utils/printHelpers.ts - Exact Preview Replication for Print
// Simple, robust print helper: duplicates a chosen panel into a full-page popup and opens the print dialog.

type PanelInput = string | HTMLElement;

const resolveElement = (panel: PanelInput): HTMLElement | null => {
  if (typeof panel === 'string') return document.querySelector(panel) as HTMLElement | null;
  return panel instanceof HTMLElement ? panel : null;
};

const collectAllStyles = (): string => {
  // Copy inline <style> tags and <link rel="stylesheet"> tags as-is.
  const nodes = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'));
  const styles = nodes
    .map((el) => {
      if (el.tagName === 'STYLE') {
        return `<style>${(el as HTMLStyleElement).innerHTML}</style>`;
      }
      if (el.tagName === 'LINK') {
        const link = el as HTMLLinkElement;
        // Preserve attrs to keep media/integrity/crossorigin if present
        const attrs = Array.from(link.attributes)
          .map(a => `${a.name}="${a.value}"`)
          .join(' ');
        return `<link ${attrs}>`;
      }
      return '';
    })
    .join('\n');

  // A few minimal print adjustments to preserve colors and avoid hidden overflow
  const printTuning = `
    <style>
      @page { size: auto; margin: 15mm; }
      html, body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      * {
        -webkit-print-color-adjust: inherit !important;
        print-color-adjust: inherit !important;
        box-sizing: border-box;
      }
      @media print {
        body { margin: 0 !important; }
      }
    </style>
  `;

  return styles + '\n' + printTuning;
};

const buildDocumentHTML = (contentHTML: string, title?: string): string => {
  const dir = document.documentElement.getAttribute('dir') || 'auto';
  const lang = document.documentElement.getAttribute('lang') || 'he';
  const baseHref = document.baseURI || window.location.href;

  // Wrap in flex container to preserve two-column layout for print
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="${baseHref}">
  <title>${title || document.title || 'Print'}</title>
  ${collectAllStyles()}
</head>
<body>
  <div id="print-root" class="flex min-h-full">${contentHTML}</div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try { window.print(); } catch (e) {}
        window.addEventListener('afterprint', function() {
          try { window.close(); } catch(e) {}
        });
        setTimeout(function(){ try { window.close(); } catch(e) {} }, 15000);
      }, 300);
    });
  </script>
</body>
</html>`;
};

/**
 * Print a chosen panel (HTMLElement or CSS selector).
 * Duplicates the panel into a full-page popup and opens the browser print dialog.
 */
export const printPanel = (panel: PanelInput, title?: string) => {
  const source = resolveElement(panel);
  if (!source) {
    alert('Selected panel was not found.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to use the print feature.');
    return;
  }

  // Deep clone to avoid mutating the original DOM
  const clone = source.cloneNode(true) as HTMLElement;

  // Optional: hide elements marked for exclusion
  // Elements can opt-out with [data-no-print] on themselves or ancestors
  clone.querySelectorAll('[data-no-print], [data-no-print] *').forEach((el) => {
    (el as HTMLElement).style.display = 'none';
  });

  const html = buildDocumentHTML(clone.outerHTML, title);

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Backwards-compatible convenience wrapper for resumes.
 * Attempts to print the default resume pane (#resume-pane) and uses resume.fullName for the title if provided.
 */
export const printResume = (resume?: { fullName?: string } | null, panelSelector: string = '#resume-pane') => {
  const title = resume?.fullName ? `קורות חיים - ${resume.fullName}` : undefined;
  printPanel(panelSelector, title);
};