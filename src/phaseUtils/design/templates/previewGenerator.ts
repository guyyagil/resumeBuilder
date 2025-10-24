// Generate static preview HTML for templates using John Doe data
import type { DesignTemplate } from '../types/design.types';
import { JOHN_DOE_DATA, JOHN_DOE_TITLE } from './exampleData';
import type { ResumeNode } from '../../../types';

/**
 * Generate a simplified HTML preview of a resume template
 * This creates a static preview without needing AI
 */
export function generateTemplatePreview(template: DesignTemplate): string {
  const { colors, fonts, layout } = template;

  // Generate CSS
  const css = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${fonts.body};
      color: ${colors.text};
      background: ${colors.background};
      line-height: 1.6;
    }

    .resume-container {
      padding: ${layout.spacing === 'compact' ? '1rem' : layout.spacing === 'spacious' ? '2rem' : '1.5rem'};
      max-width: 210mm;
      margin: 0 auto;
    }

    .resume-header {
      margin-bottom: 1.5rem;
      border-bottom: 2px solid ${colors.primary};
      padding-bottom: 0.5rem;
    }

    .resume-name {
      font-family: ${fonts.heading};
      font-size: 2rem;
      font-weight: bold;
      color: ${colors.primary};
      margin-bottom: 0.25rem;
    }

    .section {
      margin-bottom: 1.5rem;
    }

    .section-heading {
      font-family: ${fonts.heading};
      font-size: 1.25rem;
      font-weight: bold;
      color: ${colors.primary};
      margin-bottom: 0.75rem;
      border-bottom: 1px solid ${colors.accent};
      padding-bottom: 0.25rem;
    }

    .container {
      margin-bottom: 1rem;
    }

    .container-text {
      font-weight: 600;
      color: ${colors.text};
      margin-bottom: 0.5rem;
    }

    .paragraph {
      color: ${colors.textLight};
      margin-bottom: 0.5rem;
      line-height: 1.6;
    }

    .list-item {
      color: ${colors.textLight};
      padding-left: 1.25rem;
      position: relative;
      margin-bottom: 0.25rem;
    }

    .list-item:before {
      content: "•";
      position: absolute;
      left: 0;
      color: ${colors.accent};
      font-weight: bold;
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .skill-item {
      background: ${colors.accent}15;
      color: ${colors.text};
      padding: 0.25rem 0.75rem;
      border-radius: 0.25rem;
      font-size: 0.9rem;
    }

    ${template.id === 'creative-bold' ? `
      .resume-header {
        background: linear-gradient(135deg, ${colors.primary}, ${colors.accent});
        color: white;
        padding: 1.5rem;
        margin: -1.5rem -1.5rem 1.5rem -1.5rem;
        border-bottom: none;
      }

      .resume-name {
        color: white;
      }

      .section-heading {
        background: ${colors.primary}15;
        padding: 0.5rem;
        border-bottom: 3px solid ${colors.primary};
        border-radius: 0.25rem;
      }
    ` : ''}

    ${template.id === 'technical-code' && fonts.accent ? `
      .container-text {
        font-family: ${fonts.accent};
        font-size: 0.95rem;
      }
    ` : ''}
  `;

  // Generate HTML from tree
  const renderNode = (node: ResumeNode, depth: number = 0): string => {
    const content = node.text || node.title || '';

    switch (node.layout) {
      case 'heading':
        const childrenHtml = node.children?.map(child => renderNode(child, depth + 1)).join('') || '';
        return `
          <div class="section">
            <h2 class="section-heading">${content}</h2>
            ${childrenHtml}
          </div>
        `;

      case 'container':
        const containerChildren = node.children?.map(child => renderNode(child, depth + 1)).join('') || '';
        return `
          <div class="container">
            <div class="container-text">${content}</div>
            ${containerChildren}
          </div>
        `;

      case 'paragraph':
        return `<p class="paragraph">${content}</p>`;

      case 'list-item':
        // Check if this is a skills section (no bullets)
        if (node.style?.listMarker === 'none') {
          return `<div class="skill-item">${content}</div>`;
        }
        return `<div class="list-item">${content}</div>`;

      default:
        return `<div>${content}</div>`;
    }
  };

  const bodyHtml = JOHN_DOE_DATA.map(node => renderNode(node)).join('');

  return `
    <style>${css}</style>
    <div class="resume-container">
      <div class="resume-header">
        <h1 class="resume-name">${JOHN_DOE_TITLE}</h1>
        <div class="resume-title" style="color: ${colors.textLight};">Software Engineer</div>
      </div>
      ${bodyHtml}
    </div>
  `;
}

/**
 * Generate previews for all templates
 */
export function generateAllPreviews(templates: DesignTemplate[]): Map<string, string> {
  const previews = new Map<string, string>();

  for (const template of templates) {
    previews.set(template.id, generateTemplatePreview(template));
  }

  return previews;
}
