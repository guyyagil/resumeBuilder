import React from 'react';
import type { ResumeNode } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { UnifiedBlock } from './UnifiedBlock';

interface TreeResumeRendererProps {
  tree: ResumeNode[];
  className?: string;
}

export const TreeResumeRenderer: React.FC<TreeResumeRendererProps> = ({
  tree,
  className = ''
}) => {
  const textDirection = useAppStore((state) => state.textDirection);
  const historyIndex = useAppStore((state) => state.historyIndex); // Force re-render on changes
  
  console.log('🌳 TreeRenderer: Rendering tree with', tree.length, 'nodes');
  console.log('🌳 TreeRenderer: Tree structure:', tree);
  console.log('🌳 TreeRenderer: History index:', historyIndex);

  return (
    <div
      className={`resume-document ${className}`}
      dir={textDirection}
      style={{ direction: textDirection }}
      key={`tree-${historyIndex}`} // Force re-render when history changes
    >
      {tree.map((node, index) => (
        <UnifiedBlock
          key={`${node.uid}-${historyIndex}-${index}`}
          node={node}
          depth={0}
          textDirection={textDirection}
          showAddresses={false} // Can be made configurable
        />
      ))}
    </div>
  );
};


