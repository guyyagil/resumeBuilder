// John Doe example resume data for template previews
import type { ResumeNode } from '../../../types';

export const JOHN_DOE_DATA: ResumeNode[] = [
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
          }
        ]
      }
    ]
  },
  {
    uid: 'example_4',
    addr: '4',
    layout: 'heading',
    text: 'Technical Skills',
    style: { level: 1, weight: 'bold' },
    children: [
      {
        uid: 'example_4_1',
        addr: '4.1',
        layout: 'list-item',
        text: 'Languages: JavaScript, TypeScript, Python, Java',
        style: { listMarker: 'none' }
      },
      {
        uid: 'example_4_2',
        addr: '4.2',
        layout: 'list-item',
        text: 'Frameworks: React, Node.js, Express, Next.js',
        style: { listMarker: 'none' }
      },
      {
        uid: 'example_4_3',
        addr: '4.3',
        layout: 'list-item',
        text: 'Tools: Git, Docker, AWS, MongoDB, PostgreSQL',
        style: { listMarker: 'none' }
      }
    ]
  }
];

export const JOHN_DOE_TITLE = 'John Doe';
