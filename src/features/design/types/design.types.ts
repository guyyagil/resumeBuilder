// Resume design system types

export type ResumeDesignStyle =
  | 'modern'      // Clean, minimal, lots of white space
  | 'professional' // Traditional, conservative
  | 'creative'    // Bold, colorful, unique layouts
  | 'technical'   // Code-focused, monospace accents
  | 'executive';  // Elegant, sophisticated

export interface DesignTemplate {
  id: string;
  name: string;
  style: ResumeDesignStyle;
  description: string;

  // Color scheme
  colors: {
    primary: string;
    secondary: string;
    text: string;
    textLight: string;
    background: string;
    accent: string;
  };

  // Typography
  fonts: {
    heading: string;
    body: string;
    accent?: string;
  };

  // Layout preferences
  layout: {
    singleColumn: boolean;
    twoColumn: boolean;
    columnsRatio?: string; // e.g., "1:2" for left-right split
    spacing: 'compact' | 'normal' | 'spacious';
  };

  // Preview image
  previewUrl?: string;
}

export interface GeneratedResumeDesign {
  html: string;
  css: string;
  template: DesignTemplate;
  generatedAt: number;
  metadata?: {
    wordCount: number;
    estimatedPages: number;
    colorScheme: string[];
    fonts: string[];
  };
}

export interface DesignCustomization {
  colors?: Partial<DesignTemplate['colors']>;
  fonts?: Partial<DesignTemplate['fonts']>;
  spacing?: DesignTemplate['layout']['spacing'];
  customCss?: string;
}