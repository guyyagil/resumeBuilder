import React, { useState, useRef, useEffect } from 'react';
import type { ResumeNode } from '../../types';
import { detectTextDirection } from '../../utils';

interface EditableNodeProps {
  node: ResumeNode;
  depth: number;
  onUpdate: (nodeId: string, updates: any) => void;
  onRemove: (nodeId: string) => void;
  onMove: (nodeId: string, newParent: string, position: number) => void;
  onAddChild: (parentId: string) => void;
  draggedNode: string | null;
  setDraggedNode: (nodeId: string | null) => void;
}

type DropZone = 'before' | 'after' | 'inside' | null;

export const EditableNode: React.FC<EditableNodeProps> = ({
  node,
  depth,
  onUpdate,
  onRemove,
  onMove,
  onAddChild,
  draggedNode,
  setDraggedNode,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text || node.title || '');
  const [dropZone, setDropZone] = useState<DropZone>(null);
  // Start collapsed if node has children
  const [isCollapsed, setIsCollapsed] = useState(node.children && node.children.length > 0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const isDragTargetRef = useRef<boolean>(false);

  const isDragging = draggedNode === node.addr;

  // Sync editText with node changes from external updates (like AI edits)
  useEffect(() => {
    if (!isEditing) {
      setEditText(node.text || node.title || '');
    }
  }, [node.text, node.title, isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Reset drag target when dragging ends globally
  useEffect(() => {
    if (!draggedNode) {
      isDragTargetRef.current = false;
      setDropZone(null);
    }
  }, [draggedNode]);

  const handleSave = () => {
    if (!node.addr) {
      console.error('❌ Cannot save node: node.addr is undefined');
      setIsEditing(false);
      return;
    }

    if (editText.trim() !== (node.text || node.title || '')) {
      onUpdate(node.addr, {
        text: node.text ? editText : undefined,
        title: node.title ? editText : undefined
      });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditText(node.text || node.title || '');
      setIsEditing(false);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!node.addr) {
      e.preventDefault();
      return;
    }
    setDraggedNode(node.addr);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node.addr);

    // Create a custom drag image
    if (nodeRef.current) {
      const dragImage = nodeRef.current.cloneNode(true) as HTMLElement;
      dragImage.style.opacity = '0.8';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

  const handleDragEnd = () => {
    setDraggedNode(null);
    setDropZone(null);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (!draggedNode || draggedNode === node.addr || !node.addr) {
      return;
    }

    // Only handle the initial enter on the main div
    if (e.currentTarget === nodeRef.current) {
      isDragTargetRef.current = true;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!draggedNode || draggedNode === node.addr || !node.addr) {
      return;
    }

    // Only handle if this is the current target (not bubbled from child)
    if (e.currentTarget !== nodeRef.current) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Only update drop zone if we're the active target
    if (!isDragTargetRef.current) {
      return;
    }

    // Determine drop zone based on cursor position
    const rect = nodeRef.current!.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    // Top 25% = before, Bottom 25% = after, Middle 50% = inside
    let newDropZone: DropZone;
    if (y < height * 0.25) {
      newDropZone = 'before';
      e.dataTransfer.dropEffect = 'move';
    } else if (y > height * 0.75) {
      newDropZone = 'after';
      e.dataTransfer.dropEffect = 'move';
    } else {
      newDropZone = 'inside';
      e.dataTransfer.dropEffect = 'copy';
    }

    // Only update state if actually changed
    if (dropZone !== newDropZone) {
      setDropZone(newDropZone);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!draggedNode || draggedNode === node.addr || !node.addr) {
      return;
    }

    // Only handle if leaving the main div (not entering a child)
    if (e.currentTarget === nodeRef.current) {
      // Check if we're leaving to another node (not a child of this node)
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (!nodeRef.current?.contains(relatedTarget)) {
        isDragTargetRef.current = false;
        setDropZone(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Reset state
    isDragTargetRef.current = false;

    if (!draggedNode || !node.addr || draggedNode === node.addr) {
      setDropZone(null);
      return;
    }

    const currentDropZone = dropZone;
    setDropZone(null);

    // Don't execute if no drop zone was set
    if (!currentDropZone) {
      console.warn('⚠️ Drop attempted without drop zone');
      return;
    }

    console.log(`🎯 Dropping node ${draggedNode} ${currentDropZone} node ${node.addr}`);

    try {
      // Execute the appropriate action based on drop zone
      if (currentDropZone === 'inside') {
        // Make dragged node a child of this node
        onMove(draggedNode, node.addr, 0);
      } else if (currentDropZone === 'before') {
        // Insert dragged node before this node (as sibling)
        const parts = node.addr.split('.');
        if (parts.length === 1) {
          // Root level - move to root before this node (use '0' for root)
          const position = parseInt(parts[0]) - 1;
          onMove(draggedNode, '0', position);
        } else {
          // Nested - move to same parent before this node
          const parentAddr = parts.slice(0, -1).join('.');
          const position = parseInt(parts[parts.length - 1]) - 1;
          onMove(draggedNode, parentAddr, position);
        }
      } else if (currentDropZone === 'after') {
        // Insert dragged node after this node (as sibling)
        const parts = node.addr.split('.');
        if (parts.length === 1) {
          // Root level - move to root after this node (use '0' for root)
          const position = parseInt(parts[0]);
          onMove(draggedNode, '0', position);
        } else {
          // Nested - move to same parent after this node
          const parentAddr = parts.slice(0, -1).join('.');
          const position = parseInt(parts[parts.length - 1]);
          onMove(draggedNode, parentAddr, position);
        }
      }
    } catch (error) {
      console.error('❌ Drop failed:', error);
    }

    setDraggedNode(null);
  };

  const getNodeIcon = () => {
    const iconClass = "w-4 h-4";

    // Style based on depth (from address like "1", "1.2", "1.2.3")
    if (depth === 0) {
      // Top level - use heading icon
      return (
        <svg className={`${iconClass} text-blue-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (depth === 1) {
      // Second level - use container icon
      return (
        <svg className={`${iconClass} text-blue-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    } else {
      // Deeper levels - use bullet icon
      return (
        <svg className={`${iconClass} text-indigo-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      );
    }
  };

  const getNodeStyle = () => {
    let baseClasses = "group relative rounded-xl transition-shadow duration-200";

    // Different styles based on depth
    if (depth === 0) {
      // Top level - prominent heading style
      baseClasses += " bg-gradient-to-r from-blue-100 via-blue-50 to-white border-2 border-blue-300 hover:border-blue-500 hover:shadow-lg";
    } else if (depth === 1) {
      // Second level - container style
      baseClasses += " bg-white border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg";
    } else {
      // Deeper levels - bullet/list item style
      baseClasses += " bg-white border-l-4 border-blue-200 hover:border-indigo-400";
    }

    // Drop zone: inside - increase shadow only (no scale/layout change)
    if (dropZone === 'inside') {
      baseClasses += " shadow-2xl ring-2 ring-blue-400";
    }

    // Dragging state - only opacity, no scale
    if (isDragging) {
      baseClasses += " opacity-40";
    }

    return baseClasses;
  };

  const getTextStyle = () => {
    // Text styling based on depth
    if (depth === 0) {
      // Top level - large and bold
      return "text-lg font-bold text-blue-900";
    } else if (depth === 1) {
      // Second level - medium weight
      return "text-base font-medium text-gray-900";
    } else {
      // Deeper levels - smaller text
      return "text-sm text-gray-800";
    }
  };

  // Detect text direction for the current node content
  const getTextDir = () => {
    const content = node.text || node.title || '';
    return detectTextDirection(content);
  };

  // Render text with markdown bold support (**text** -> <strong>text</strong>)
  const renderTextWithBold = (text: string) => {
    // Split by ** markers, handling edge cases
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      // Check if this part is bold (wrapped in **)
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-bold">{boldText}</strong>;
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  const getDropZoneIndicator = () => {
    if (!dropZone) return null;

    if (dropZone === 'inside') {
      return (
        <div className="absolute inset-0 bg-blue-100 border-2 border-dashed border-blue-500 rounded-xl opacity-50 pointer-events-none animate-pulse z-10">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl">
              Drop inside as child
            </div>
          </div>
        </div>
      );
    }

    // For before/after, show indicator WITHOUT affecting layout
    const isBeforeZone = dropZone === 'before';
    return (
      <div
        className={`absolute left-0 right-0 pointer-events-none z-20 ${
          isBeforeZone ? '-top-6' : '-bottom-6'
        }`}
        style={{ height: '48px' }}
      >
        {/* Expanding background to show space will open */}
        <div className={`absolute inset-x-0 ${isBeforeZone ? 'top-0' : 'bottom-0'} h-12 bg-gradient-to-b ${
          isBeforeZone
            ? 'from-blue-100/50 to-transparent'
            : 'from-transparent to-blue-100/50'
        } animate-pulse`} />

        {/* Insertion line */}
        <div className="absolute inset-0 flex items-center px-2">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full shadow-lg" />
        </div>

        {/* Label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-xl">
            {isBeforeZone ? '↑ Drop above' : '↓ Drop below'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative mb-3">
      {/* Drop zone indicator - absolutely positioned to not affect layout */}
      {getDropZoneIndicator()}

      <div
        ref={nodeRef}
        className={`${getNodeStyle()} p-4 transition-all duration-200`}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Node Content */}
        <div className="flex items-start space-x-3">
          {/* Drag Handle & Icon */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
            <div className="p-1.5 rounded-lg bg-white shadow-md border border-blue-100">
              {getNodeIcon()}
            </div>
          </div>

          {/* Editable Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                dir={detectTextDirection(editText)}
                className="w-full p-3 border-2 border-blue-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-lg"
                rows={Math.max(2, editText.split('\n').length)}
              />
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                dir={getTextDir()}
                className={`${getTextStyle()} cursor-text hover:bg-white/50 p-3 rounded-lg min-h-[3rem] whitespace-pre-wrap transition-colors`}
              >
                {node.text || node.title ? (
                  renderTextWithBold(node.text || node.title || '')
                ) : (
                  <span className="text-gray-400 italic">Click to edit...</span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            {/* Action Buttons - Show on Hover */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Collapse/Expand Button - Only show if node has children */}
              {node.children && node.children.length > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsCollapsed(!isCollapsed);
                  }}
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all shadow-sm hover:shadow-md"
                  title={isCollapsed ? 'Expand children' : 'Collapse children'}
                >
                  {isCollapsed ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              )}

              {/* Add Child Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (node.addr) onAddChild(node.addr);
                }}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all shadow-sm hover:shadow-md"
                title="Add child block"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (node.addr && window.confirm('Are you sure you want to delete this block?')) {
                    onRemove(node.addr);
                  }
                }}
                className="p-2 text-blue-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shadow-sm hover:shadow-md"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Render Children with Indentation - Only show if not collapsed */}
      {!isCollapsed && node.children && node.children.length > 0 && (
        <div className="ml-8 space-y-2 pl-4 border-l-2 border-blue-200">
          {node.children.map((child) => (
            <EditableNode
              key={child.uid}
              node={child}
              depth={depth + 1}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onMove={onMove}
              onAddChild={onAddChild}
              draggedNode={draggedNode}
              setDraggedNode={setDraggedNode}
            />
          ))}
        </div>
      )}

      {/* Collapsed indicator - show how many children are hidden */}
      {isCollapsed && node.children && node.children.length > 0 && (
        <div className="ml-8 mt-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="font-medium">{node.children.length} item{node.children.length !== 1 ? 's' : ''} hidden</span>
          </div>
        </div>
      )}
    </div>
  );
};
