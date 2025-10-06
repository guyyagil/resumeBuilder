// Conversion utilities for legacy resume format compatibility
// Bridge between new tree format and legacy section-based format

import type { ResumeNode, LegacyResume, LegacySection } from '../types';
import { generateUid } from '../utils/treeUtils';

/**
 * Convert tree format to legacy format
 * @param tree - The resume tree
 * @returns Legacy resume format
 */
export function treeToLegacy(tree: ResumeNode[]): LegacyResume {
  // Extract contact info
  const contactNode = tree.find(n => n.meta?.type === 'contact');
  const personalInfo = {
    name: contactNode?.children?.find(c => c.title.toLowerCase().includes('name'))?.content || '',
    email: contactNode?.children?.find(c => c.title.toLowerCase().includes('email'))?.content || '',
    phone: contactNode?.children?.find(c => c.title.toLowerCase().includes('phone'))?.content || '',
    location: contactNode?.children?.find(c => c.title.toLowerCase().includes('location'))?.content || ''
  };
  
  // Convert sections
  const sections: LegacySection[] = tree
    .filter(node => node.meta?.type === 'section' && node.uid !== contactNode?.uid)
    .map(sectionNode => ({
      id: sectionNode.uid,
      title: sectionNode.title,
      items: (sectionNode.children || []).map(itemNode => ({
        id: itemNode.uid,
        title: itemNode.title,
        description: itemNode.content || '',
        bullets: (itemNode.children || [])
          .map(bullet => bullet.content || bullet.title)
      }))
    }));
  
  return { personalInfo, sections };
}

/**
 * Convert legacy format to tree format
 * @param resume - Legacy resume format
 * @returns Resume tree
 */
export function legacyToTree(resume: LegacyResume): ResumeNode[] {
  const tree: ResumeNode[] = [];
  
  // Create contact section
  const contactChildren: ResumeNode[] = [];
  
  if (resume.personalInfo.name) {
    contactChildren.push({
      uid: generateUid(),
      title: 'Name',
      content: resume.personalInfo.name,
      meta: { type: 'text' }
    });
  }
  
  if (resume.personalInfo.email) {
    contactChildren.push({
      uid: generateUid(),
      title: 'Email',
      content: resume.personalInfo.email,
      meta: { type: 'text' }
    });
  }
  
  if (resume.personalInfo.phone) {
    contactChildren.push({
      uid: generateUid(),
      title: 'Phone',
      content: resume.personalInfo.phone,
      meta: { type: 'text' }
    });
  }
  
  if (resume.personalInfo.location) {
    contactChildren.push({
      uid: generateUid(),
      title: 'Location',
      content: resume.personalInfo.location,
      meta: { type: 'text' }
    });
  }
  
  if (contactChildren.length > 0) {
    tree.push({
      uid: generateUid(),
      title: 'Contact Information',
      meta: { type: 'contact' },
      children: contactChildren
    });
  }
  
  // Convert sections
  resume.sections.forEach(section => {
      tree.push({
      uid: section.id || generateUid(),
        title: section.title ?? 'Untitled',
      meta: { type: 'section' },
        children: (section.items ?? []).map(item => ({
          uid: item.id || generateUid(),
          title: item.title ?? 'Untitled',
          content: item.description ?? '',
          meta: { type: 'item' },
          children: (item.bullets ?? []).map(bullet => ({
            uid: generateUid(),
            title: typeof bullet === 'string' ? 'Bullet' : 'Bullet',
            content: bullet ?? '',
            meta: { type: 'bullet' }
          }))
        }))
    });
  });
  
  return tree;
}

/**
 * Create a default/empty resume tree structure
 * @returns Empty resume tree with standard sections
 */
export function createDefaultTree(): ResumeNode[] {
  return [
    {
      uid: generateUid(),
      title: 'Contact Information',
      meta: { type: 'contact' },
      children: []
    },
    {
      uid: generateUid(),
      title: 'Professional Summary',
      meta: { type: 'section' },
      children: []
    },
    {
      uid: generateUid(),
      title: 'Work Experience',
      meta: { type: 'section' },
      children: []
    },
    {
      uid: generateUid(),
      title: 'Education',
      meta: { type: 'section' },
      children: []
    },
    {
      uid: generateUid(),
      title: 'Skills',
      meta: { type: 'section' },
      children: []
    }
  ];
}
