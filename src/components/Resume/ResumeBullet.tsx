// components/Resume/ResumeBullet.tsx

import React, { useState } from 'react';
import type { ResumeNode, Numbering } from '../../types';

interface Props {
  node: ResumeNode;
  numbering: Numbering;
}

export const ResumeBullet: React.FC<Props> = ({ node }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <li
      className="text-gray-700 relative group flex items-start"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Custom bullet point */}
      <span className="text-gray-400 mr-2 mt-1.5 flex-shrink-0">•</span>
      
      {/* Bullet content */}
      <span className="leading-relaxed">
        {node.content || node.title}
      </span>
      
      {/* Address on hover for debugging */}
      {isHovered && (
        <span className="absolute -left-16 text-xs text-gray-400 font-mono bg-white px-1 rounded shadow-sm border">
          {node.addr}
        </span>
      )}
    </li>
  );
};
