// components/Resume/ResumeItem.tsx

import React from 'react';
import type { ResumeNode, Numbering } from '../../types';
import { ResumeBullet } from './ResumeBullet';

interface Props {
  node: ResumeNode;
  numbering: Numbering;
}

export const ResumeItem: React.FC<Props> = ({ node, numbering }) => {
  const { meta } = node;
  const isTextNode = meta?.type === 'text' || !node.children || node.children.length === 0;
  
  // Handle simple text nodes (like skills lists)
  if (isTextNode) {
    return (
      <div className="mb-3">
        <div className="text-gray-700 leading-relaxed">
          <span className="font-medium text-gray-900">{node.title}:</span> {node.content || ''}
        </div>
      </div>
    );
  }
  
  // Handle complex items (jobs, education, projects)
  return (
    <div className="mb-6 pl-0">
      {/* Item header with title and date */}
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
          {node.title}
        </h3>
        {meta?.dateRange && (
          <span className="text-sm text-gray-600 italic font-medium ml-4 flex-shrink-0">
            {meta.dateRange}
          </span>
        )}
      </div>
      
      {/* Location */}
      {meta?.location && (
        <div className="text-sm text-gray-600 mb-2 italic">
          {meta.location}
        </div>
      )}
      
      {/* Item description */}
      {node.content && node.content !== node.title && (
        <div className="text-gray-700 mb-3 leading-relaxed">
          {node.content}
        </div>
      )}
      
      {/* Bullet points */}
      {node.children && node.children.length > 0 && (
        <ul className="space-y-1 ml-4">
          {node.children.map((bullet) => (
            <ResumeBullet
              key={bullet.uid}
              node={bullet}
              numbering={numbering}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
