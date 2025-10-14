// Generate layout-specific previews (without color - showing structure only)
import type { LayoutStructure } from '../types/design.types';
import { JOHN_DOE_DATA, JOHN_DOE_TITLE } from './exampleData';
import type { ResumeNode } from '../../../shared/types';

/**
 * Generate a grayscale preview showing only the layout structure
 * Colors will be applied after user selects color scheme
 */
export function generateLayoutPreview(layout: LayoutStructure): string {
  const { structure, typography } = layout;

  // Base styles - grayscale to show structure
  const baseStyles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      color: #333;
      background: #ffffff;
      line-height: 1.5;
    }

    .resume-container {
      padding: 1.5rem;
      max-width: 210mm;
      margin: 0 auto;
      ${structure.hasSidebar ? 'display: flex; gap: 1.5rem;' : ''}
    }

    ${structure.hasSidebar && structure.sidebarPosition === 'left' ? `
      .sidebar {
        width: ${structure.sidebarWidth};
        background: #f5f5f5;
        padding: 1.5rem;
        order: 1;
      }
      .main-content {
        width: ${structure.mainContentWidth};
        order: 2;
      }
    ` : ''}

    ${structure.hasSidebar && structure.sidebarPosition === 'right' ? `
      .main-content {
        width: ${structure.mainContentWidth};
        order: 1;
      }
      .sidebar {
        width: ${structure.sidebarWidth};
        background: #f5f5f5;
        padding: 1.5rem;
        order: 2;
      }
    ` : ''}

    .resume-header {
      margin-bottom: 1.5rem;
      ${structure.headerHeight ? `min-height: ${structure.headerHeight}; background: #f0f0f0; padding: 1.5rem; margin: -1.5rem -1.5rem 1.5rem -1.5rem;` : 'border-bottom: 2px solid #ddd; padding-bottom: 0.75rem;'}
    }

    .resume-name {
      font-size: ${typography.nameSize === 'xxlarge' ? '2.5rem' : typography.nameSize === 'xlarge' ? '2rem' : '1.75rem'};
      font-weight: bold;
      color: #000;
      margin-bottom: 0.5rem;
    }

    .resume-title {
      font-size: 1.1rem;
      color: #666;
      ${layout.type === 'header-focus' ? 'font-size: 1.3rem;' : ''}
    }

    .contact-info {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
      font-size: 0.9rem;
      color: #666;
    }

    .section {
      margin-bottom: ${typography.bodySpacing === 'spacious' ? '2rem' : typography.bodySpacing === 'compact' ? '1rem' : '1.5rem'};
    }

    .section-heading {
      font-size: 1.15rem;
      font-weight: bold;
      color: #000;
      margin-bottom: 0.75rem;
      ${typography.headingStyle === 'underline' ? 'border-bottom: 2px solid #ddd; padding-bottom: 0.25rem;' : ''}
      ${typography.headingStyle === 'background' ? 'background: #f0f0f0; padding: 0.5rem; border-radius: 0.25rem;' : ''}
      ${typography.headingStyle === 'bold' ? 'text-transform: uppercase; letter-spacing: 0.5px;' : ''}
    }

    .container {
      margin-bottom: 1rem;
    }

    .container-text {
      font-weight: 600;
      color: #333;
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
    }

    .job-meta {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .list-item {
      color: #555;
      padding-left: 1.25rem;
      position: relative;
      margin-bottom: 0.25rem;
      font-size: 0.9rem;
    }

    .list-item:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #999;
    }

    .skill-tag {
      background: #e5e5e5;
      padding: 0.25rem 0.75rem;
      border-radius: 0.25rem;
      font-size: 0.85rem;
      display: inline-block;
      margin: 0.25rem 0.25rem 0.25rem 0;
    }

    ${structure.sectionArrangement === 'grid' ? `
      .content-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-top: 1.5rem;
      }
    ` : ''}
  `;

  // Separate sections into sidebar and main content
  const sidebarSections = ['Technical Skills', 'Skills', 'Licenses', 'Licenses', 'Activities', 'Education'];
  const mainSections = ['Professional Summary', 'Work Experience', 'Experience'];

  const renderNode = (node: ResumeNode): string => {
    const content = node.text || node.title || '';

    switch (node.layout) {
      case 'heading':
        const childrenHtml = node.children?.map(child => renderNode(child)).join('') || '';
        return `
          <div class="section">
            <h2 class="section-heading">${content}</h2>
            ${childrenHtml}
          </div>
        `;

      case 'container':
        const containerChildren = node.children?.map(child => renderNode(child)).join('') || '';
        return `
          <div class="container">
            <div class="container-text">${content}</div>
            ${containerChildren}
          </div>
        `;

      case 'paragraph':
        return `<p class="paragraph" style="color: #555; line-height: 1.6; margin-bottom: 0.5rem;">${content}</p>`;

      case 'list-item':
        if (node.style?.listMarker === 'none') {
          return `<span class="skill-tag">${content}</span>`;
        }
        return `<div class="list-item">${content}</div>`;

      default:
        return `<div>${content}</div>`;
    }
  };

  // Build content based on layout
  let bodyHtml = '';
  let sidebarContentHtml = '';
  let mainContentHtml = '';

  if (structure.hasSidebar) {
    // Split into sidebar and main content
    const sidebarNodes = JOHN_DOE_DATA.filter(node =>
      sidebarSections.some(s => (node.text || node.title || '').includes(s))
    );

    const mainNodes = JOHN_DOE_DATA.filter(node =>
      mainSections.some(s => (node.text || node.title || '').includes(s)) ||
      (!sidebarSections.some(s => (node.text || node.title || '').includes(s)) &&
       !mainSections.some(s => (node.text || node.title || '').includes(s)))
    );

    sidebarContentHtml = sidebarNodes.map(node => renderNode(node)).join('');
    mainContentHtml = mainNodes.map(node => renderNode(node)).join('');
  } else if (structure.sectionArrangement === 'grid' && layout.type === 'header-focus') {
    // Header-focus with grid below
    const mainSections = JOHN_DOE_DATA.slice(0, 2).map(node => renderNode(node)).join('');
    const gridSections = JOHN_DOE_DATA.slice(2).map(node => renderNode(node)).join('');

    bodyHtml = `
      ${mainSections}
      <div class="content-grid">
        ${gridSections}
      </div>
    `;
  } else {
    // Single column
    bodyHtml = JOHN_DOE_DATA.map(node => renderNode(node)).join('');
  }

  return `
    <style>${baseStyles}</style>
    <div class="resume-container">
      ${structure.hasSidebar ? `
        <div class="sidebar">
          <h1 class="resume-name" style="font-size: 1.5rem;">${JOHN_DOE_TITLE}</h1>
          <div class="resume-title" style="font-size: 0.9rem; margin-bottom: 1rem;">Software Engineer</div>
          ${sidebarContentHtml}
        </div>
        <div class="main-content">
          ${mainContentHtml}
        </div>
      ` : `
        <div class="resume-header">
          <h1 class="resume-name">${JOHN_DOE_TITLE}</h1>
          <div class="resume-title">Software Engineer</div>
          ${layout.type === 'header-focus' ? `
            <div class="contact-info">
              <span>📧 john.doe@email.com</span>
              <span>📱 (555) 123-4567</span>
              <span>📍 San Francisco, CA</span>
            </div>
          ` : ''}
        </div>
        ${bodyHtml}
      `}
    </div>
  `;
}

/**
 * Generate previews for all layouts
 */
export function generateAllLayoutPreviews(layouts: LayoutStructure[]): Map<string, string> {
  const previews = new Map<string, string>();

  for (const layout of layouts) {
    previews.set(layout.type, generateLayoutPreview(layout));
  }

  return previews;
}
