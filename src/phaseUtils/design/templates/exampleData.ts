// John Doe example resume data for template previews
import type { ResumeNode } from '../../../types';

// Helper function to get layout-specific data
export function getLayoutExampleData(layoutType: string): ResumeNode[] {
  switch (layoutType) {
    case 'single-column':
      return SINGLE_COLUMN_DATA;
    case 'two-column-left':
    case 'two-column-right':
      return SIDEBAR_DATA;
    case 'header-focus':
      return HEADER_FOCUS_DATA;
    case 'modern-split':
      return MODERN_SPLIT_DATA;
    default:
      return JOHN_DOE_DATA;
  }
}

// Classic single column - moderate content
const SINGLE_COLUMN_DATA: ResumeNode[] = [
  {
    uid: 'example_1',
    addr: '1',
    layout: 'heading',
    text: 'Professional Summary',
    style: { level: 1, weight: 'bold' },
    children: [
      {
        uid: 'example_1_1',
        addr: '1.1',
        layout: 'paragraph',
        text: 'Results-driven software engineer with 5+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud infrastructure. Passionate about creating elegant solutions to complex problems.',
        style: {}
      }
    ]
  },
  {
    uid: 'example_2',
    addr: '2',
    layout: 'heading',
    text: 'Work Experience',
    style: { level: 1, weight: 'bold' },
    children: [
      {
        uid: 'example_2_1',
        addr: '2.1',
        layout: 'container',
        text: 'Senior Software Engineer | TechCorp Inc. | 2021 - Present',
        style: { weight: 'semibold' },
        children: [
          {
            uid: 'example_2_1_1',
            addr: '2.1.1',
            layout: 'list-item',
            text: 'Led development of microservices architecture serving 1M+ users',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'example_2_1_2',
            addr: '2.1.2',
            layout: 'list-item',
            text: 'Reduced API response time by 40% through optimization',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'example_2_1_3',
            addr: '2.1.3',
            layout: 'list-item',
            text: 'Mentored 3 junior developers and conducted code reviews',
            style: { listMarker: 'bullet' }
          }
        ]
      },
      {
        uid: 'example_2_2',
        addr: '2.2',
        layout: 'container',
        text: 'Software Engineer | StartupXYZ | 2019 - 2021',
        style: { weight: 'semibold' },
        children: [
          {
            uid: 'example_2_2_1',
            addr: '2.2.1',
            layout: 'list-item',
            text: 'Built responsive web applications using React and TypeScript',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'example_2_2_2',
            addr: '2.2.2',
            layout: 'list-item',
            text: 'Implemented CI/CD pipeline reducing deployment time by 60%',
            style: { listMarker: 'bullet' }
          }
        ]
      },
      {
        uid: 'example_2_3',
        addr: '2.3',
        layout: 'container',
        text: 'Junior Developer | WebSolutions Ltd. | 2017 - 2019',
        style: { weight: 'semibold' },
        children: []
      }
    ]
  },
  {
    uid: 'example_3',
    addr: '3',
    layout: 'heading',
    text: 'Education',
    style: { level: 1, weight: 'bold' },
    children: [
      {
        uid: 'example_3_1',
        addr: '3.1',
        layout: 'container',
        text: 'B.S. Computer Science | University of Technology | 2015 - 2019',
        style: { weight: 'semibold' },
        children: [
          {
            uid: 'example_3_1_1',
            addr: '3.1.1',
            layout: 'list-item',
            text: 'GPA: 3.8/4.0, Magna Cum Laude',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'example_3_1_2',
            addr: '3.1.2',
            layout: 'list-item',
            text: 'Relevant Coursework: Data Structures, Algorithms, Web Development',
            style: { listMarker: 'bullet' }
          }
        ]
      }
    ]
  },
  {
    uid: 'example_4',
    addr: '4',
    layout: 'heading',
    text: 'Projects',
    style: { level: 1, weight: 'bold' },
    children: [
      {
        uid: 'example_4_1',
        addr: '4.1',
        layout: 'container',
        text: 'E-Commerce Platform | Personal Project',
        style: { weight: 'semibold' },
        children: [
          {
            uid: 'example_4_1_1',
            addr: '4.1.1',
            layout: 'list-item',
            text: 'Built full-stack application with React, Node.js, and PostgreSQL',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'example_4_1_2',
            addr: '4.1.2',
            layout: 'list-item',
            text: 'Integrated payment processing and user authentication',
            style: { listMarker: 'bullet' }
          }
        ]
      }
    ]
  },
  {
    uid: 'example_5',
    addr: '5',
    layout: 'heading',
    text: 'Technical Skills',
    style: { level: 1, weight: 'bold' },
    children: [
      {
        uid: 'example_5_1',
        addr: '5.1',
        layout: 'list-item',
        text: 'Languages: JavaScript, TypeScript, Python, Java',
        style: { listMarker: 'none' }
      },
      {
        uid: 'example_5_2',
        addr: '5.2',
        layout: 'list-item',
        text: 'Frameworks: React, Node.js, Express, Next.js',
        style: { listMarker: 'none' }
      },
      {
        uid: 'example_5_3',
        addr: '5.3',
        layout: 'list-item',
        text: 'Tools: Git, Docker, AWS, MongoDB, PostgreSQL',
        style: { listMarker: 'none' }
      }
    ]
  }
];

// Sidebar layouts - need MUCH MORE content to fill the page
const SIDEBAR_DATA: ResumeNode[] = [
  {
    uid: 'sidebar_1',
    addr: '1',
    layout: 'heading',
    text: 'Professional Summary',
    style: { level: 1, weight: 'bold' },
    children: [
      {
        uid: 'sidebar_1_1',
        addr: '1.1',
        layout: 'paragraph',
        text: 'Results-driven software engineer with 5+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud infrastructure. Passionate about creating elegant solutions to complex problems.',
        style: {}
      }
    ]
  },
  {
    uid: 'sidebar_2',
    addr: '2',
    layout: 'heading',
    text: 'Work Experience',
    style: { level: 1, weight: 'bold' },
    children: [
      {
        uid: 'sidebar_2_1',
        addr: '2.1',
        layout: 'container',
        text: 'Senior Software Engineer | TechCorp Inc. | 2021 - Present',
        style: { weight: 'semibold' },
        children: [
          {
            uid: 'sidebar_2_1_1',
            addr: '2.1.1',
            layout: 'list-item',
            text: 'Led development of microservices architecture serving 1M+ users',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'sidebar_2_1_2',
            addr: '2.1.2',
            layout: 'list-item',
            text: 'Reduced API response time by 40% through optimization',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'sidebar_2_1_3',
            addr: '2.1.3',
            layout: 'list-item',
            text: 'Mentored 3 junior developers and conducted code reviews',
            style: { listMarker: 'bullet' }
          }
        ]
      },
      {
        uid: 'sidebar_2_2',
        addr: '2.2',
        layout: 'container',
        text: 'Software Engineer | StartupXYZ | 2019 - 2021',
        style: { weight: 'semibold' },
        children: [
          {
            uid: 'sidebar_2_2_1',
            addr: '2.2.1',
            layout: 'list-item',
            text: 'Built responsive web applications using React and TypeScript',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'sidebar_2_2_2',
            addr: '2.2.2',
            layout: 'list-item',
            text: 'Implemented CI/CD pipeline reducing deployment time by 60%',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'sidebar_2_2_3',
            addr: '2.2.3',
            layout: 'list-item',
            text: 'Collaborated with design team to create seamless user experiences',
            style: { listMarker: 'bullet' }
          }
        ]
      },
      {
        uid: 'sidebar_2_3',
        addr: '2.3',
        layout: 'container',
        text: 'Junior Developer | WebSolutions Ltd. | 2017 - 2019',
        style: { weight: 'semibold' },
        children: [
          {
            uid: 'sidebar_2_3_1',
            addr: '2.3.1',
            layout: 'list-item',
            text: 'Developed and maintained e-commerce platforms for retail clients',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'sidebar_2_3_2',
            addr: '2.3.2',
            layout: 'list-item',
            text: 'Participated in agile development sprints and daily standups',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'sidebar_2_3_3',
            addr: '2.3.3',
            layout: 'list-item',
            text: 'Improved website performance and load times through code optimization',
            style: { listMarker: 'bullet' }
          }
        ]
      }
    ]
  },
  {
    uid: 'sidebar_3',
    addr: '3',
    layout: 'heading',
    text: 'Projects',
    style: { level: 1, weight: 'bold' },
    children: [
      {
        uid: 'sidebar_3_1',
        addr: '3.1',
        layout: 'container',
        text: 'E-Commerce Platform | Personal Project',
        style: { weight: 'semibold' },
        children: [
          {
            uid: 'sidebar_3_1_1',
            addr: '3.1.1',
            layout: 'list-item',
            text: 'Built full-stack application with React, Node.js, and PostgreSQL',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'sidebar_3_1_2',
            addr: '3.1.2',
            layout: 'list-item',
            text: 'Integrated payment processing and user authentication',
            style: { listMarker: 'bullet' }
          }
        ]
      },
      {
        uid: 'sidebar_3_2',
        addr: '3.2',
        layout: 'container',
        text: 'Task Management App | Open Source',
        style: { weight: 'semibold' },
        children: [
          {
            uid: 'sidebar_3_2_1',
            addr: '3.2.1',
            layout: 'list-item',
            text: 'Developed collaborative task tracking tool with real-time updates',
            style: { listMarker: 'bullet' }
          }
        ]
      }
    ]
  },
  {
    uid: 'sidebar_4',
    addr: '4',
    layout: 'heading',
    text: 'Education',
    style: { level: 1, weight: 'bold' },
    children: [
      {
        uid: 'sidebar_4_1',
        addr: '4.1',
        layout: 'container',
        text: 'B.S. Computer Science | University of Technology | 2015 - 2019',
        style: { weight: 'semibold' },
        children: [
          {
            uid: 'sidebar_4_1_1',
            addr: '4.1.1',
            layout: 'list-item',
            text: 'GPA: 3.8/4.0, Magna Cum Laude',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'sidebar_4_1_2',
            addr: '4.1.2',
            layout: 'list-item',
            text: 'Relevant Coursework: Data Structures, Algorithms, Web Development',
            style: { listMarker: 'bullet' }
          }
        ]
      }
    ]
  },
  {
    uid: 'sidebar_5',
    addr: '5',
    layout: 'heading',
    text: 'Technical Skills',
    style: { level: 1, weight: 'bold' },
    children: [
      {
        uid: 'sidebar_5_1',
        addr: '5.1',
        layout: 'list-item',
        text: 'Languages: JavaScript, TypeScript, Python, Java',
        style: { listMarker: 'none' }
      },
      {
        uid: 'sidebar_5_2',
        addr: '5.2',
        layout: 'list-item',
        text: 'Frameworks: React, Node.js, Express, Next.js',
        style: { listMarker: 'none' }
      },
      {
        uid: 'sidebar_5_3',
        addr: '5.3',
        layout: 'list-item',
        text: 'Tools: Git, Docker, AWS, MongoDB, PostgreSQL',
        style: { listMarker: 'none' }
      }
    ]
  }
];

// Header focus - needs more content for grid layout
const HEADER_FOCUS_DATA: ResumeNode[] = [
  {
    uid: 'header_1',
    addr: '1',
    layout: 'heading',
    text: 'Professional Summary',
    style: { level: 1, weight: 'bold' },
    children: [
      {
        uid: 'header_1_1',
        addr: '1.1',
        layout: 'paragraph',
        text: 'Results-driven software engineer with 5+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud infrastructure. Passionate about creating elegant solutions to complex problems.',
        style: {}
      }
    ]
  },
  {
    uid: 'header_2',
    addr: '2',
    layout: 'heading',
    text: 'Work Experience',
    style: { level: 1, weight: 'bold' },
    children: [
      {
        uid: 'header_2_1',
        addr: '2.1',
        layout: 'container',
        text: 'Senior Software Engineer | TechCorp Inc. | 2021 - Present',
        style: { weight: 'semibold' },
        children: [
          {
            uid: 'header_2_1_1',
            addr: '2.1.1',
            layout: 'list-item',
            text: 'Led development of microservices architecture serving 1M+ users',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'header_2_1_2',
            addr: '2.1.2',
            layout: 'list-item',
            text: 'Reduced API response time by 40% through optimization',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'header_2_1_3',
            addr: '2.1.3',
            layout: 'list-item',
            text: 'Mentored 3 junior developers and conducted code reviews',
            style: { listMarker: 'bullet' }
          }
        ]
      },
      {
        uid: 'header_2_2',
        addr: '2.2',
        layout: 'container',
        text: 'Software Engineer | StartupXYZ | 2019 - 2021',
        style: { weight: 'semibold' },
        children: [
          {
            uid: 'header_2_2_1',
            addr: '2.2.1',
            layout: 'list-item',
            text: 'Built responsive web applications using React and TypeScript',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'header_2_2_2',
            addr: '2.2.2',
            layout: 'list-item',
            text: 'Implemented CI/CD pipeline reducing deployment time by 60%',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'header_2_2_3',
            addr: '2.2.3',
            layout: 'list-item',
            text: 'Collaborated with design team to create seamless user experiences',
            style: { listMarker: 'bullet' }
          }
        ]
      },
      {
        uid: 'header_2_3',
        addr: '2.3',
        layout: 'container',
        text: 'Junior Developer | WebSolutions Ltd. | 2017 - 2019',
        style: { weight: 'semibold' },
        children: [
          {
            uid: 'header_2_3_1',
            addr: '2.3.1',
            layout: 'list-item',
            text: 'Developed and maintained e-commerce platforms for retail clients',
            style: { listMarker: 'bullet' }
          }
        ]
      }
    ]
  },
  {
    uid: 'header_3',
    addr: '3',
    layout: 'heading',
    text: 'Education',
    style: { level: 1, weight: 'bold' },
    children: [
      {
        uid: 'header_3_1',
        addr: '3.1',
        layout: 'container',
        text: 'B.S. Computer Science | University of Technology | 2015 - 2019',
        style: { weight: 'semibold' },
        children: [
          {
            uid: 'header_3_1_1',
            addr: '3.1.1',
            layout: 'list-item',
            text: 'GPA: 3.8/4.0, Magna Cum Laude',
            style: { listMarker: 'bullet' }
          },
          {
            uid: 'header_3_1_2',
            addr: '3.1.2',
            layout: 'list-item',
            text: 'Relevant Coursework: Data Structures, Algorithms, Web Development',
            style: { listMarker: 'bullet' }
          }
        ]
      }
    ]
  },
  {
    uid: 'header_4',
    addr: '4',
    layout: 'heading',
    text: 'Technical Skills',
    style: { level: 1, weight: 'bold' },
    children: [
      {
        uid: 'header_4_1',
        addr: '4.1',
        layout: 'list-item',
        text: 'Languages: JavaScript, TypeScript, Python, Java',
        style: { listMarker: 'none' }
      },
      {
        uid: 'header_4_2',
        addr: '4.2',
        layout: 'list-item',
        text: 'Frameworks: React, Node.js, Express, Next.js',
        style: { listMarker: 'none' }
      },
      {
        uid: 'header_4_3',
        addr: '4.3',
        layout: 'list-item',
        text: 'Tools: Git, Docker, AWS, MongoDB, PostgreSQL',
        style: { listMarker: 'none' }
      }
    ]
  }
];

// Modern split - spacious content
const MODERN_SPLIT_DATA: ResumeNode[] = SINGLE_COLUMN_DATA;

// Default fallback data
export const JOHN_DOE_DATA: ResumeNode[] = SINGLE_COLUMN_DATA;

export const JOHN_DOE_TITLE = 'John Doe';
