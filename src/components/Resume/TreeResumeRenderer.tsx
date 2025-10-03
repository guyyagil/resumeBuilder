import React from 'react';
import type { ResumeNode } from '../../types';

interface TreeResumeRendererProps {
  tree: ResumeNode[];
  className?: string;
}

export const TreeResumeRenderer: React.FC<TreeResumeRendererProps> = ({ 
  tree, 
  className = '' 
}) => {
  return (
    <div className={`tree-resume ${className}`}>
      {tree.map((node) => (
        <ResumeNodeRenderer key={node.uid} node={node} />
      ))}
    </div>
  );
};

interface ResumeNodeRendererProps {
  node: ResumeNode;
  depth?: number;
}

const ResumeNodeRenderer: React.FC<ResumeNodeRendererProps> = ({ 
  node, 
  depth = 0 
}) => {
  const { meta, title, content, children } = node;
  
  // Contact section special handling
  if (meta?.type === 'contact') {
    return (
      <header className="mb-6 border-b border-gray-300 pb-2">
        <h1 className="text-2xl font-semibold">
          {children?.find(c => c.title.toLowerCase().includes('name'))?.content || title}
        </h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mt-1">
          {children?.filter(c => !c.title.toLowerCase().includes('name')).map((child) => (
            <span key={child.uid}>{child.content || child.title}</span>
          ))}
        </div>
      </header>
    );
  }
  
  // Section level (depth 0)
  if (meta?.type === 'section' || depth === 0) {
    return (
      <section className="mb-6">
        <h2 className="text-lg font-semibold border-b border-gray-300 pb-1 mb-3">
          {title}
        </h2>
        {content && (
          <p className="text-sm text-gray-700 mb-3">{content}</p>
        )}
        {children && (
          <div className="space-y-4">
            {children.map((child) => (
              <ResumeNodeRenderer key={child.uid} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </section>
    );
  }
  
  // Item level (depth 1) - jobs, projects, education
  if (meta?.type === 'item' || depth === 1) {
    return (
      <div className="mb-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium text-sm">{title}</h3>
          {meta?.dateRange && (
            <span className="text-xs text-gray-600 italic">
              {meta.dateRange}
            </span>
          )}
        </div>
        
        {meta?.location && (
          <div className="text-xs text-gray-600 mb-1">{meta.location}</div>
        )}
        
        {content && (
          <p className="text-sm text-gray-700 mb-2">{content}</p>
        )}
        
        {children && children.length > 0 && (
          <ul className="list-disc list-inside space-y-1 ml-2">
            {children.map((bullet) => (
              <ResumeNodeRenderer key={bullet.uid} node={bullet} depth={depth + 1} />
            ))}
          </ul>
        )}
      </div>
    );
  }
  
  // Bullet level (depth 2+) or text nodes
  return (
    <li className="text-sm text-gray-700">
      {content || title}
    </li>
  );
};