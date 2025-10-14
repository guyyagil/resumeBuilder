// Resume design system types

export type ResumeLayoutType =
  | 'single-column'      // Traditional single column (like John Smith example)
  | 'two-column-left'    // Sidebar on left (like Catherine Barnett example)
  | 'two-column-right'   // Sidebar on right
  | 'header-focus'       // Large header with content below (like Kaida Kim example)
  | 'modern-split';      // Modern split design (like Olivia Wilson example)

export interface LayoutStructure {
  type: ResumeLayoutType;
  name: string;
  description: string;

  // Structure definition
  structure: {
    hasLargeName: boolean;         // Large name at top
    hasSidebar: boolean;           // Has a sidebar
    sidebarPosition?: 'left' | 'right';
    sidebarWidth?: string;         // e.g., "30%", "35%"
    mainContentWidth?: string;     // e.g., "70%", "65%"
    headerHeight?: string;         // For header-focused layouts
    sectionArrangement: 'vertical' | 'grid' | 'mixed';
  };

  // Typography preferences for this layout
  typography: {
    nameSize: 'large' | 'xlarge' | 'xxlarge';
    headingStyle: 'bold' | 'underline' | 'background' | 'minimal';
    bodySpacing: 'compact' | 'normal' | 'spacious';
  };
}

export interface ColorScheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
    textLight: string;
    background: string;
    accent: string;
    sidebarBg?: string;  // For layouts with sidebars
  };
}

export interface DesignTemplate {
  id: string;
  layout: LayoutStructure;
  colorScheme: ColorScheme;

  // Typography (moved from layout, applied after color selection)
  fonts: {
    heading: string;
    body: string;
    accent?: string;
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