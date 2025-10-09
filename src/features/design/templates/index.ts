// Design template selection and management - moved from designTemplates.ts
import type { DesignTemplate } from '../types/design.types';

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    style: 'modern',
    description: 'Clean lines, plenty of white space, and a focus on content. Perfect for tech and startup roles.',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      text: '#1e293b',
      textLight: '#64748b',
      background: '#ffffff',
      accent: '#3b82f6',
    },
    fonts: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif',
    },
    layout: {
      singleColumn: true,
      twoColumn: false,
      spacing: 'normal',
    },
  },
  {
    id: 'professional-classic',
    name: 'Professional Classic',
    style: 'professional',
    description: 'Traditional, conservative layout. Ideal for corporate, finance, and legal positions.',
    colors: {
      primary: '#1e3a8a',
      secondary: '#475569',
      text: '#0f172a',
      textLight: '#475569',
      background: '#ffffff',
      accent: '#1e40af',
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'Arial, sans-serif',
    },
    layout: {
      singleColumn: true,
      twoColumn: false,
      spacing: 'compact',
    },
  },
  {
    id: 'creative-bold',
    name: 'Creative Bold',
    style: 'creative',
    description: 'Eye-catching design with bold colors. Great for design, marketing, and creative roles.',
    colors: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      text: '#1f2937',
      textLight: '#6b7280',
      background: '#ffffff',
      accent: '#8b5cf6',
    },
    fonts: {
      heading: 'Poppins, sans-serif',
      body: 'Open Sans, sans-serif',
    },
    layout: {
      singleColumn: false,
      twoColumn: true,
      columnsRatio: '1:2',
      spacing: 'normal',
    },
  },
  {
    id: 'technical-code',
    name: 'Technical',
    style: 'technical',
    description: 'Code-inspired design with monospace accents. Perfect for software engineers and developers.',
    colors: {
      primary: '#059669',
      secondary: '#6b7280',
      text: '#111827',
      textLight: '#6b7280',
      background: '#ffffff',
      accent: '#10b981',
    },
    fonts: {
      heading: 'Roboto, sans-serif',
      body: 'Roboto, sans-serif',
      accent: 'Fira Code, monospace',
    },
    layout: {
      singleColumn: true,
      twoColumn: false,
      spacing: 'normal',
    },
  },
];

/**
 * Select the best design template based on resume content and job description
 */
export function selectDesignTemplate(
  resumeContent: string,
  jobDescription?: string
): DesignTemplate {
  const content = (resumeContent + ' ' + (jobDescription || '')).toLowerCase();

  // Technical/Engineering roles
  if (
    content.includes('software') ||
    content.includes('developer') ||
    content.includes('engineer') ||
    content.includes('programming')
  ) {
    return DESIGN_TEMPLATES.find((t) => t.id === 'technical-code') || DESIGN_TEMPLATES[0];
  }

  // Creative roles
  if (
    content.includes('design') ||
    content.includes('creative') ||
    content.includes('marketing') ||
    content.includes('brand')
  ) {
    return DESIGN_TEMPLATES.find((t) => t.id === 'creative-bold') || DESIGN_TEMPLATES[0];
  }

  // Professional/Corporate roles
  if (
    content.includes('finance') ||
    content.includes('legal') ||
    content.includes('consulting') ||
    content.includes('analyst')
  ) {
    return DESIGN_TEMPLATES.find((t) => t.id === 'professional-classic') || DESIGN_TEMPLATES[0];
  }

  // Default to modern minimal
  return DESIGN_TEMPLATES[0];
}