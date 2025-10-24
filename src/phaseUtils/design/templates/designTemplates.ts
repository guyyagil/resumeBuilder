import type { DesignTemplate, LayoutStructure, ColorScheme } from '../types/design.types';

// Layout structures
const SINGLE_COLUMN_LAYOUT: LayoutStructure = {
  type: 'single-column',
  name: 'Single Column',
  description: 'Traditional single column layout',
  structure: {
    hasLargeName: true,
    hasSidebar: false,
    sectionArrangement: 'vertical',
  },
  typography: {
    nameSize: 'xlarge',
    headingStyle: 'bold',
    bodySpacing: 'normal',
  },
  // Backward compatibility
  singleColumn: true,
  twoColumn: false,
  spacing: 'normal',
};

const SINGLE_COLUMN_COMPACT_LAYOUT: LayoutStructure = {
  type: 'single-column',
  name: 'Single Column Compact',
  description: 'Traditional single column with compact spacing',
  structure: {
    hasLargeName: true,
    hasSidebar: false,
    sectionArrangement: 'vertical',
  },
  typography: {
    nameSize: 'large',
    headingStyle: 'underline',
    bodySpacing: 'compact',
  },
  // Backward compatibility
  singleColumn: true,
  twoColumn: false,
  spacing: 'compact',
};

const TWO_COLUMN_LEFT_LAYOUT: LayoutStructure = {
  type: 'two-column-left',
  name: 'Two Column (Left Sidebar)',
  description: 'Sidebar on left with main content on right',
  structure: {
    hasLargeName: true,
    hasSidebar: true,
    sidebarPosition: 'left',
    sidebarWidth: '33%',
    mainContentWidth: '67%',
    sectionArrangement: 'mixed',
  },
  typography: {
    nameSize: 'xlarge',
    headingStyle: 'background',
    bodySpacing: 'normal',
  },
  // Backward compatibility
  singleColumn: false,
  twoColumn: true,
  columnsRatio: '1:2',
  spacing: 'normal',
};

const TWO_COLUMN_LEFT_SPACIOUS_LAYOUT: LayoutStructure = {
  type: 'two-column-left',
  name: 'Two Column Spacious (Left Sidebar)',
  description: 'Sidebar on left with spacious layout',
  structure: {
    hasLargeName: true,
    hasSidebar: true,
    sidebarPosition: 'left',
    sidebarWidth: '25%',
    mainContentWidth: '75%',
    sectionArrangement: 'mixed',
  },
  typography: {
    nameSize: 'xxlarge',
    headingStyle: 'minimal',
    bodySpacing: 'spacious',
  },
  // Backward compatibility
  singleColumn: false,
  twoColumn: true,
  columnsRatio: '1:3',
  spacing: 'spacious',
};

// Color schemes
const MODERN_BLUE_SCHEME: ColorScheme = {
  id: 'modern-blue',
  name: 'Modern Blue',
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    text: '#1e293b',
    textLight: '#64748b',
    background: '#ffffff',
    accent: '#3b82f6',
  },
};

const PROFESSIONAL_NAVY_SCHEME: ColorScheme = {
  id: 'professional-navy',
  name: 'Professional Navy',
  colors: {
    primary: '#1e3a8a',
    secondary: '#475569',
    text: '#0f172a',
    textLight: '#475569',
    background: '#ffffff',
    accent: '#1e40af',
  },
};

const CREATIVE_PURPLE_SCHEME: ColorScheme = {
  id: 'creative-purple',
  name: 'Creative Purple',
  colors: {
    primary: '#7c3aed',
    secondary: '#a78bfa',
    text: '#1f2937',
    textLight: '#6b7280',
    background: '#ffffff',
    accent: '#8b5cf6',
    sidebarBg: '#f9f5ff',
  },
};

const TECHNICAL_GREEN_SCHEME: ColorScheme = {
  id: 'technical-green',
  name: 'Technical Green',
  colors: {
    primary: '#059669',
    secondary: '#6b7280',
    text: '#111827',
    textLight: '#6b7280',
    background: '#ffffff',
    accent: '#10b981',
  },
};

const EXECUTIVE_SLATE_SCHEME: ColorScheme = {
  id: 'executive-slate',
  name: 'Executive Slate',
  colors: {
    primary: '#0f172a',
    secondary: '#334155',
    text: '#0f172a',
    textLight: '#64748b',
    background: '#ffffff',
    accent: '#475569',
    sidebarBg: '#f8fafc',
  },
};

// Design templates
export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: 'modern-minimal',
    layout: SINGLE_COLUMN_LAYOUT,
    colorScheme: MODERN_BLUE_SCHEME,
    fonts: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif',
    },
    // Backward compatibility
    name: SINGLE_COLUMN_LAYOUT.name,
    style: 'Modern Minimal',
    description: SINGLE_COLUMN_LAYOUT.description,
    colors: MODERN_BLUE_SCHEME.colors,
  },
  {
    id: 'professional-classic',
    layout: SINGLE_COLUMN_COMPACT_LAYOUT,
    colorScheme: PROFESSIONAL_NAVY_SCHEME,
    fonts: {
      heading: 'Georgia, serif',
      body: 'Arial, sans-serif',
    },
    // Backward compatibility
    name: SINGLE_COLUMN_COMPACT_LAYOUT.name,
    style: 'Professional Classic',
    description: SINGLE_COLUMN_COMPACT_LAYOUT.description,
    colors: PROFESSIONAL_NAVY_SCHEME.colors,
  },
  {
    id: 'creative-bold',
    layout: TWO_COLUMN_LEFT_LAYOUT,
    colorScheme: CREATIVE_PURPLE_SCHEME,
    fonts: {
      heading: 'Poppins, sans-serif',
      body: 'Open Sans, sans-serif',
    },
    // Backward compatibility
    name: TWO_COLUMN_LEFT_LAYOUT.name,
    style: 'Creative Bold',
    description: TWO_COLUMN_LEFT_LAYOUT.description,
    colors: CREATIVE_PURPLE_SCHEME.colors,
  },
  {
    id: 'technical-code',
    layout: SINGLE_COLUMN_LAYOUT,
    colorScheme: TECHNICAL_GREEN_SCHEME,
    fonts: {
      heading: 'Roboto, sans-serif',
      body: 'Roboto, sans-serif',
      accent: 'Fira Code, monospace',
    },
    // Backward compatibility
    name: SINGLE_COLUMN_LAYOUT.name,
    style: 'Technical Code',
    description: SINGLE_COLUMN_LAYOUT.description,
    colors: TECHNICAL_GREEN_SCHEME.colors,
  },
  {
    id: 'executive-elegant',
    layout: TWO_COLUMN_LEFT_SPACIOUS_LAYOUT,
    colorScheme: EXECUTIVE_SLATE_SCHEME,
    fonts: {
      heading: 'Playfair Display, serif',
      body: 'Lato, sans-serif',
    },
    // Backward compatibility
    name: TWO_COLUMN_LEFT_SPACIOUS_LAYOUT.name,
    style: 'Executive Elegant',
    description: TWO_COLUMN_LEFT_SPACIOUS_LAYOUT.description,
    colors: EXECUTIVE_SLATE_SCHEME.colors,
  },
];

// Helper function to get template metadata
export function getTemplateMetadata(template: DesignTemplate) {
  return {
    id: template.id,
    name: template.layout.name,
    layoutType: template.layout.type,
    colorSchemeName: template.colorScheme.name,
  };
}

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

  // Executive roles
  if (
    content.includes('executive') ||
    content.includes('director') ||
    content.includes('vp') ||
    content.includes('chief') ||
    content.includes('ceo') ||
    content.includes('cto')
  ) {
    return DESIGN_TEMPLATES.find((t) => t.id === 'executive-elegant') || DESIGN_TEMPLATES[0];
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
