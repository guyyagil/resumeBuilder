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
        <ResumeNodeRenderer key={node.uid} node={node} depth={0} />
      ))}
    </div>
  );
};

interface ResumeNodeRendererProps {
  node: ResumeNode;
  depth: number;
}

const ResumeNodeRenderer: React.FC<ResumeNodeRendererProps> = ({
  node,
  depth
}) => {
  const { title, content, children, layout } = node;
  const hasChildren = children && children.length > 0;
  const isLeaf = !hasChildren;

  // Root level (depth 0): Always render as section headers
  if (depth === 0) {
    return (
      <section className="mb-6">
        <h2 className="text-lg font-semibold border-b border-gray-300 pb-1 mb-3 uppercase">
          {title}
        </h2>
        {content && !hasChildren && (
          <p className="text-sm text-gray-700">{content}</p>
        )}
        {hasChildren && (
          <ChildrenRenderer layout={layout} depth={depth}>
            {children.map((child) => (
              <ResumeNodeRenderer key={child.uid} node={child} depth={depth + 1} />
            ))}
          </ChildrenRenderer>
        )}
      </section>
    );
  }

  // For all other depths: Use leaf vs parent logic

  // LEAF NODE: Render as bullet point
  if (isLeaf) {
    return (
      <li className="text-sm text-gray-700">
        {content || title}
      </li>
    );
  }

  // PARENT NODE: Render as item with children as bullets
  return (
    <div className="mb-3">
      {/* Title for parent items */}
      <div className="font-medium text-sm mb-1">{title}</div>

      {/* Content if different from title */}
      {content && content !== title && (
        <div className="text-sm text-gray-700 mb-1">{content}</div>
      )}

      {/* Children rendered as bulleted list */}
      <ul className="list-disc list-inside space-y-1 ml-2">
        {children.map((child) => (
          <ResumeNodeRenderer key={child.uid} node={child} depth={depth + 1} />
        ))}
      </ul>
    </div>
  );
};

// Component to handle different layout styles for children
const ChildrenRenderer: React.FC<{
  layout?: string;
  depth: number;
  children: React.ReactNode;
}> = ({ layout, depth, children }) => {
  switch (layout) {
    case 'inline':
      // Horizontal inline layout (contact info)
      return (
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {children}
        </div>
      );

    case 'grid':
      // Grid layout (skills)
      return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {children}
        </div>
      );

    case 'columns':
      // Multi-column layout
      return (
        <div className="columns-2 gap-6">
          {children}
        </div>
      );

    case 'compact':
      // Compact spacing
      return (
        <div className="space-y-1">
          {children}
        </div>
      );

    case 'card':
      // Card layout with border
      return (
        <div className="grid grid-cols-1 gap-4">
          {children}
        </div>
      );

    case 'default':
    default:
      // Standard vertical list
      return (
        <div className="space-y-3">
          {children}
        </div>
      );
  }
};
