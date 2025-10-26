// Generate layout-specific previews with optional color schemes
import type { LayoutStructure, ColorScheme } from '../types/design.types';
import { getLayoutExampleData, JOHN_DOE_TITLE } from './exampleData';
import type { ResumeNode } from '../../../types';

/**
 * Generate a preview showing the layout structure with optional colors
 * @param layout - The layout structure to preview
 * @param colorScheme - Optional color scheme to apply (defaults to grayscale)
 */
export function generateLayoutPreview(layout: LayoutStructure, colorScheme?: ColorScheme): string {
  const { structure, typography } = layout;

  // Use provided color scheme or default to grayscale
  const colors = colorScheme ? {
    primary: colorScheme.colors.primary,
    secondary: colorScheme.colors.secondary,
    text: colorScheme.colors.text,
    textLight: colorScheme.colors.textLight,
    background: colorScheme.colors.background,
    accent: colorScheme.colors.accent,
    sidebarBg: colorScheme.colors.sidebarBg || colorScheme.colors.secondary,
  } : {
    primary: '#000000',
    secondary: '#f5f5f5',
    text: '#333333',
    textLight: '#666666',
    background: '#ffffff',
    accent: '#dddddd',
    sidebarBg: '#f5f5f5',
  };

  // Base styles using dynamic colors
  const baseStyles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      color: ${colors.text};
      background: ${colors.background};
      line-height: 1.5;
      width: 210mm;
      height: 297mm;
      overflow: hidden;
    }

    .resume-container {
      padding: 1.5rem;
      width: 100%;
      height: 100%;
      margin: 0 auto;
      ${structure.hasSidebar ? 'display: flex; gap: 1.5rem;' : ''}
    }

    ${structure.hasSidebar && structure.sidebarPosition === 'left' ? `
      .sidebar {
        width: ${structure.sidebarWidth};
        background: ${colors.sidebarBg};
        padding: 1.5rem;
        order: 1;
        flex-shrink: 0;
        height: 100%;
        overflow: auto;
      }
      .main-content {
        width: ${structure.mainContentWidth};
        order: 2;
        flex-shrink: 0;
        height: 100%;
        overflow: auto;
      }
    ` : ''}

    ${structure.hasSidebar && structure.sidebarPosition === 'right' ? `
      .main-content {
        width: ${structure.mainContentWidth};
        order: 1;
        flex-shrink: 0;
        height: 100%;
        overflow: auto;
      }
      .sidebar {
        width: ${structure.sidebarWidth};
        background: ${colors.sidebarBg};
        padding: 1.5rem;
        order: 2;
        flex-shrink: 0;
        height: 100%;
        overflow: auto;
      }
    ` : ''}

    .resume-header {
      margin-bottom: 1.5rem;
      ${structure.headerHeight ? `min-height: ${structure.headerHeight}; background: ${colors.primary}; color: ${colors.background}; padding: 1.5rem; margin: -1.5rem -1.5rem 1.5rem -1.5rem;` : `border-bottom: 2px solid ${colors.accent}; padding-bottom: 0.75rem;`}
    }

    .resume-name {
      font-size: ${typography.nameSize === 'xxlarge' ? '2.5rem' : typography.nameSize === 'xlarge' ? '2rem' : '1.75rem'};
      font-weight: bold;
      color: ${structure.headerHeight ? colors.background : colors.primary};
      margin-bottom: 0.5rem;
    }

    .resume-title {
      font-size: 1.1rem;
      color: ${structure.headerHeight ? colors.background : colors.textLight};
      ${layout.type === 'header-focus' ? 'font-size: 1.3rem;' : ''}
    }

    .contact-info {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
      font-size: 0.9rem;
      color: ${structure.headerHeight ? colors.background : colors.textLight};
    }

    .section {
      margin-bottom: ${typography.bodySpacing === 'spacious' ? '2rem' : typography.bodySpacing === 'compact' ? '1rem' : '1.5rem'};
    }

    .section-heading {
      font-size: 1.15rem;
      font-weight: bold;
      color: ${colors.primary};
      margin-bottom: 0.75rem;
      ${typography.headingStyle === 'underline' ? `border-bottom: 2px solid ${colors.accent}; padding-bottom: 0.25rem;` : ''}
      ${typography.headingStyle === 'background' ? `background: ${colors.secondary}; padding: 0.5rem; border-radius: 0.25rem;` : ''}
      ${typography.headingStyle === 'bold' ? 'text-transform: uppercase; letter-spacing: 0.5px;' : ''}
    }

    .container {
      margin-bottom: 1rem;
    }

    .container-text {
      font-weight: 600;
      color: ${colors.text};
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
    }

    .job-meta {
      font-size: 0.85rem;
      color: ${colors.textLight};
      margin-bottom: 0.5rem;
    }

    .list-item {
      color: ${colors.text};
      padding-left: 1.25rem;
      position: relative;
      margin-bottom: 0.25rem;
      font-size: 0.9rem;
    }

    .list-item:before {
      content: "•";
      position: absolute;
      left: 0;
      color: ${colors.accent};
    }

    .skill-tag {
      background: ${colors.primary};
      color: ${colors.background};
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

  // Get layout-specific example data
  const exampleData = getLayoutExampleData(layout.type);

  // Build content based on layout
  let bodyHtml = '';
  let sidebarContentHtml = '';
  let mainContentHtml = '';

  if (structure.hasSidebar) {
    // Split into sidebar and main content
    const sidebarNodes = exampleData.filter(node =>
      sidebarSections.some(s => (node.text || node.title || '').includes(s))
    );

    const mainNodes = exampleData.filter(node =>
      mainSections.some(s => (node.text || node.title || '').includes(s)) ||
      (!sidebarSections.some(s => (node.text || node.title || '').includes(s)) &&
       !mainSections.some(s => (node.text || node.title || '').includes(s)))
    );

    sidebarContentHtml = sidebarNodes.map(node => renderNode(node)).join('');
    mainContentHtml = mainNodes.map(node => renderNode(node)).join('');
  } else if (structure.sectionArrangement === 'grid' && layout.type === 'header-focus') {
    // Header-focus with grid below
    const mainSections = exampleData.slice(0, 2).map(node => renderNode(node)).join('');
    const gridSections = exampleData.slice(2).map(node => renderNode(node)).join('');

    bodyHtml = `
      ${mainSections}
      <div class="content-grid">
        ${gridSections}
      </div>
    `;
  } else {
    // Single column
    bodyHtml = exampleData.map(node => renderNode(node)).join('');
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
