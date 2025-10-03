import type { ResumeNode } from '../types';
import { generateUid } from './treeUtils';

export function createSampleResumeTree(): ResumeNode[] {
  return [
    // Contact Information
    {
      uid: generateUid(),
      title: 'Contact Information',
      meta: { type: 'contact' },
      children: [
        {
          uid: generateUid(),
          title: 'Name',
          content: 'John Doe',
          meta: { type: 'text' }
        },
        {
          uid: generateUid(),
          title: 'Email',
          content: 'john.doe@email.com',
          meta: { type: 'text' }
        },
        {
          uid: generateUid(),
          title: 'Phone',
          content: '(555) 123-4567',
          meta: { type: 'text' }
        },
        {
          uid: generateUid(),
          title: 'Location',
          content: 'San Francisco, CA',
          meta: { type: 'text' }
        }
      ]
    },
    
    // Professional Summary
    {
      uid: generateUid(),
      title: 'Professional Summary',
      content: 'Experienced software engineer with 5+ years developing scalable web applications. Passionate about clean code, system architecture, and mentoring junior developers.',
      meta: { type: 'section' }
    },
    
    // Work Experience
    {
      uid: generateUid(),
      title: 'Work Experience',
      meta: { type: 'section' },
      children: [
        {
          uid: generateUid(),
          title: 'Google — Senior Software Engineer',
          content: 'Led development of high-traffic web services',
          meta: { 
            type: 'item',
            dateRange: '2022 - Present',
            location: 'Mountain View, CA',
            company: 'Google',
            role: 'Senior Software Engineer'
          },
          children: [
            {
              uid: generateUid(),
              title: 'Architected microservices handling 10M+ daily requests with 99.9% uptime',
              content: 'Architected microservices handling 10M+ daily requests with 99.9% uptime',
              meta: { type: 'bullet' }
            },
            {
              uid: generateUid(),
              title: 'Led team of 6 engineers delivering 3 major features ahead of schedule',
              content: 'Led team of 6 engineers delivering 3 major features ahead of schedule',
              meta: { type: 'bullet' }
            },
            {
              uid: generateUid(),
              title: 'Reduced API latency by 60% through Redis caching and query optimization',
              content: 'Reduced API latency by 60% through Redis caching and query optimization',
              meta: { type: 'bullet' }
            }
          ]
        },
        {
          uid: generateUid(),
          title: 'Startup Inc — Full Stack Developer',
          content: 'Built core platform features from scratch',
          meta: { 
            type: 'item',
            dateRange: '2020 - 2022',
            location: 'San Francisco, CA',
            company: 'Startup Inc',
            role: 'Full Stack Developer'
          },
          children: [
            {
              uid: generateUid(),
              title: 'Developed React dashboard serving 50K+ monthly active users',
              content: 'Developed React dashboard serving 50K+ monthly active users',
              meta: { type: 'bullet' }
            },
            {
              uid: generateUid(),
              title: 'Implemented CI/CD pipeline reducing deployment time by 80%',
              content: 'Implemented CI/CD pipeline reducing deployment time by 80%',
              meta: { type: 'bullet' }
            }
          ]
        }
      ]
    },
    
    // Education
    {
      uid: generateUid(),
      title: 'Education',
      meta: { type: 'section' },
      children: [
        {
          uid: generateUid(),
          title: 'BS Computer Science — MIT',
          meta: { 
            type: 'item',
            dateRange: '2016 - 2020',
            location: 'Cambridge, MA'
          },
          children: [
            {
              uid: generateUid(),
              title: 'GPA: 3.8/4.0',
              content: 'GPA: 3.8/4.0',
              meta: { type: 'bullet' }
            },
            {
              uid: generateUid(),
              title: 'Dean\'s List 2018-2020',
              content: 'Dean\'s List 2018-2020',
              meta: { type: 'bullet' }
            }
          ]
        }
      ]
    },
    
    // Skills
    {
      uid: generateUid(),
      title: 'Technical Skills',
      meta: { type: 'section' },
      children: [
        {
          uid: generateUid(),
          title: 'Languages',
          content: 'Python, TypeScript, JavaScript, Go, Java',
          meta: { type: 'text' }
        },
        {
          uid: generateUid(),
          title: 'Frameworks',
          content: 'React, Node.js, Django, Express, FastAPI',
          meta: { type: 'text' }
        },
        {
          uid: generateUid(),
          title: 'Tools & Technologies',
          content: 'Docker, Kubernetes, AWS, PostgreSQL, Redis, Git',
          meta: { type: 'text' }
        }
      ]
    }
  ];
}

export function createEmptyResumeTree(): ResumeNode[] {
  return [
    {
      uid: generateUid(),
      title: 'Contact Information',
      meta: { type: 'contact' },
      children: [
        {
          uid: generateUid(),
          title: 'Name',
          content: '',
          meta: { type: 'text' }
        },
        {
          uid: generateUid(),
          title: 'Email',
          content: '',
          meta: { type: 'text' }
        },
        {
          uid: generateUid(),
          title: 'Phone',
          content: '',
          meta: { type: 'text' }
        },
        {
          uid: generateUid(),
          title: 'Location',
          content: '',
          meta: { type: 'text' }
        }
      ]
    }
  ];
}