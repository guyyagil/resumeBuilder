import React from 'react';
import type { GeneratedResumeDesign } from '../../features/design/types/design.types';

interface HTMLResumeRendererProps {
  design: GeneratedResumeDesign;
  className?: string;
}

/**
 * Renders the AI-generated HTML/CSS resume design in an iframe for isolation
 */
export const HTMLResumeRenderer: React.FC<HTMLResumeRendererProps> = ({
  design,
  className = '',
}) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;

    if (!doc) return;

    // Write the complete HTML to the iframe
    doc.open();
    doc.write(design.html);
    doc.close();

    let lastHeight = 0;

    // Auto-resize iframe to content height with debouncing
    const resizeIframe = () => {
      if (doc.body) {
        const height = doc.body.scrollHeight;
        // Only update if height changed significantly (more than 5px)
        if (Math.abs(height - lastHeight) > 5) {
          lastHeight = height;
          iframe.style.height = `${height + 20}px`; // Add small buffer
        }
      }
    };

    // Resize after content loads
    setTimeout(resizeIframe, 150);

    // Add resize observer with debouncing for dynamic content
    let resizeTimeout: number;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resizeIframe, 100);
    };

    const resizeObserver = new ResizeObserver(debouncedResize);
    if (doc.body) {
      resizeObserver.observe(doc.body);
    }

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, [design.html]);

  return (
    <div className={`html-resume-container ${className}`}>
      <iframe
        ref={iframeRef}
        title="Resume Preview"
        className="w-full border-0"
        sandbox="allow-same-origin allow-scripts"
        style={{
          minHeight: '800px',
          backgroundColor: 'white',
        }}
      />
    </div>
  );
};
