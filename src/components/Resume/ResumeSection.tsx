// components/Resume/ResumeSection.tsx

import React from 'react';
import type { ResumeNode, Numbering } from '../../types';
import { ResumeItem } from './ResumeItem';

interface Props {
  node: ResumeNode;
  numbering: Numbering;
}

export const ResumeSection: React.FC<Props> = ({ node, numbering }) => {
  // Check if this is a contact-related section
  const isContactSection = node.meta?.type === 'contact' || 
    node.title.toLowerCase().includes('contact') ||
    node.title.toLowerCase().includes('information');
  
  // Check if this looks like individual contact info (name, phone, email, etc.)
  const isContactField = !node.children || node.children.length === 0;
  const isNameField = node.title && node.title.length > 0 && 
    !node.title.includes('@') && 
    !node.title.includes('(') && 
    !node.title.includes('http') &&
    !node.title.toLowerCase().includes('phone') &&
    !node.title.toLowerCase().includes('email') &&
    !node.title.toLowerCase().includes('location') &&
    node.title.split(' ').length <= 4; // Likely a name
  
  // If this is a standalone contact field, render it as part of contact info
  if (isContactField && (
    node.title.includes('@') || 
    node.title.includes('(') || 
    node.title.includes('http') ||
    node.title.toLowerCase().includes('phone') ||
    node.title.toLowerCase().includes('email') ||
    node.title.toLowerCase().includes('location') ||
    node.title.toLowerCase().includes('github') ||
    node.title.toLowerCase().includes('linkedin') ||
    isNameField
  )) {
    // Don't render individual contact fields - they should be grouped
    return null;
  }
  
  // Special handling for contact information section
  if (isContactSection) {
    return (
      <section className="mb-8 text-center">
        {/* Contact name as main heading */}
        {node.children?.find(child => child.title && !child.title.includes('@') && !child.title.includes('('))?.title && (
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {node.children.find(child => child.title && !child.title.includes('@') && !child.title.includes('('))?.title}
          </h1>
        )}
        
        {/* Contact details in a row */}
        <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-gray-600">
          {node.children?.filter(child => 
            child.title.includes('@') || 
            child.title.includes('(') || 
            child.title.includes('linkedin') ||
            child.title.toLowerCase().includes('phone') ||
            child.title.toLowerCase().includes('email') ||
            child.title.toLowerCase().includes('location') ||
            (child.content && (child.content.includes('@') || child.content.includes('(')))
          ).map((child, index, array) => (
            <React.Fragment key={child.uid}>
              <span>{child.content || child.title}</span>
              {index < array.length - 1 && <span className="text-gray-400">•</span>}
            </React.Fragment>
          ))}
        </div>
      </section>
    );
  }
  
  // Regular section with proper hierarchy
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-300 pb-1 mb-4 uppercase tracking-wide">
        {node.title}
      </h2>
      
      {node.content && (
        <div className="mb-4 text-gray-700 leading-relaxed">
          {node.content}
        </div>
      )}
      
      <div className="space-y-4">
        {node.children?.map((child) => (
          <ResumeItem
            key={child.uid}
            node={child}
            numbering={numbering}
          />
        ))}
      </div>
    </section>
  );
};
