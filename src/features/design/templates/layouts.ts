// Layout structure definitions based on different resume styles
import type { LayoutStructure } from '../types/design.types';

export const LAYOUT_STRUCTURES: LayoutStructure[] = [
  {
    type: 'single-column',
    name: 'Classic Professional',
    description: 'Traditional single-column layout. Clean and straightforward, perfect for conservative industries.',
    structure: {
      hasLargeName: true,
      hasSidebar: false,
      sectionArrangement: 'vertical',
    },
    typography: {
      nameSize: 'xlarge',
      headingStyle: 'underline',
      bodySpacing: 'normal',
    },
  },
  {
    type: 'two-column-left',
    name: 'Modern Sidebar (Left)',
    description: 'Sidebar on the left with skills and contact info. Main content on the right. Eye-catching and modern.',
    structure: {
      hasLargeName: true,
      hasSidebar: true,
      sidebarPosition: 'left',
      sidebarWidth: '35%',
      mainContentWidth: '65%',
      sectionArrangement: 'vertical',
    },
    typography: {
      nameSize: 'large',
      headingStyle: 'bold',
      bodySpacing: 'normal',
    },
  },
  {
    type: 'two-column-right',
    name: 'Modern Sidebar (Right)',
    description: 'Main content on the left, sidebar on the right. Emphasizes work experience and achievements.',
    structure: {
      hasLargeName: true,
      hasSidebar: true,
      sidebarPosition: 'right',
      sidebarWidth: '30%',
      mainContentWidth: '70%',
      sectionArrangement: 'vertical',
    },
    typography: {
      nameSize: 'large',
      headingStyle: 'minimal',
      bodySpacing: 'normal',
    },
  },
  {
    type: 'header-focus',
    name: 'Bold Header',
    description: 'Large prominent header with contact info, followed by two-column content below. Great for creative roles.',
    structure: {
      hasLargeName: true,
      hasSidebar: false,
      headerHeight: '180px',
      sectionArrangement: 'grid',
    },
    typography: {
      nameSize: 'xxlarge',
      headingStyle: 'bold',
      bodySpacing: 'normal',
    },
  },
  {
    type: 'modern-split',
    name: 'Modern Split',
    description: 'Contemporary design with centered header and smart content organization. Perfect for modern industries.',
    structure: {
      hasLargeName: true,
      hasSidebar: false,
      sectionArrangement: 'mixed',
    },
    typography: {
      nameSize: 'xlarge',
      headingStyle: 'background',
      bodySpacing: 'spacious',
    },
  },
];
