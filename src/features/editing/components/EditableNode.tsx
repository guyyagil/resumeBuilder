import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../../store';
import type { ResumeNode } from '../../../shared/types';
import { detectTextDirection } from '../../../shared/utils/languageDetection';

interface EditableNodeProps {
  node: ResumeNode;
  depth: number;
  onUpdate: (nodeId: string, updates: any) => void;
  onRemove: (nodeId: string) => void;
  onMove: (nodeId: string, newParent: string, position: number) => void;
  onAddChild: (parentId: string, nodeType: 'section' | 'item' | 'bullet') => void;
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
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [dropZone, setDropZone] = useState<DropZone>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const isDragTargetRef = useRef<boolean>(false);

  // Block selection state
  const { selectedBlocks, toggleBlockSelection } = useAppStore();
  const isSelected = node.addr ? selectedBlocks.includes(node.addr) : false;
  const isDragging = draggedNode === node.addr;

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
          // Root level - move to root before this node
          const position = parseInt(parts[0]) - 1;
          onMove(draggedNode, 'root', position);
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
          // Root level - move to root after this node
          const position = parseInt(parts[0]);
          onMove(draggedNode, 'root', position);
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

    switch (node.layout) {
      case 'heading':
        return (
          <svg className={`${iconClass} text-blue-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'list-item':
        return (
          <svg className={`${iconClass} text-green-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        );
      default:
        return (
          <svg className={`${iconClass} text-purple-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        );
    }
  };

  const getNodeStyle = () => {
    let baseClasses = "group relative rounded-lg transition-shadow duration-200";

    // Different styles based on layout
    if (node.layout === 'heading') {
      baseClasses += " bg-gradient-to-r from-blue-50 to-indigo-50 border-2";
      if (isSelected) {
        baseClasses += " border-green-500 shadow-xl ring-4 ring-green-200";
      } else {
        baseClasses += " border-blue-200 hover:border-blue-400 hover:shadow-md";
      }
    } else if (node.layout === 'list-item') {
      baseClasses += " bg-white border-l-4 border-gray-200 hover:border-green-400";
      if (isSelected) {
        baseClasses += " border-green-500 shadow-xl ring-4 ring-green-100";
      }
    } else {
      baseClasses += " bg-white border";
      if (isSelected) {
        baseClasses += " border-green-500 shadow-xl ring-4 ring-green-100";
      } else {
        baseClasses += " border-gray-200 hover:border-purple-300 hover:shadow-md";
      }
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
    if (node.layout === 'heading') {
      return "text-lg font-bold text-gray-900";
    } else if (node.layout === 'list-item') {
      return "text-sm text-gray-700";
    } else {
      return "text-base font-medium text-gray-800";
    }
  };

  // Detect text direction for the current node content
  const getTextDir = () => {
    const content = node.text || node.title || '';
    return detectTextDirection(content);
  };

  const getDropZoneIndicator = () => {
    if (!dropZone) return null;

    if (dropZone === 'inside') {
      return (
        <div className="absolute inset-0 bg-blue-100 border-2 border-dashed border-blue-500 rounded-lg opacity-50 pointer-events-none animate-pulse z-10">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
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
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
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
        onClick={(e) => {
          // Only handle selection if not clicking on editable content or buttons
          if (!isEditing && !e.defaultPrevented && node.addr) {
            e.stopPropagation();
            toggleBlockSelection(node.addr);
          }
        }}
      >
        {/* Node Content */}
        <div className="flex items-start space-x-3">
          {/* Drag Handle & Icon */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
            <div className="p-1.5 rounded-lg bg-white shadow-sm">
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
                className="w-full p-3 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white shadow-inner"
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
                {node.text || node.title || (
                  <span className="text-gray-400 italic">Click to edit...</span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            {/* Citation Indicator */}
            {isSelected && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg" title="Cited for AI chat">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-bold">Cited</span>
              </div>
            )}

            {/* Action Buttons - Show on Hover */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Add Child Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAddMenu(!showAddMenu);
                }}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Add child"
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
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Add Menu Dropdown */}
        {showAddMenu && (
          <div className="absolute top-full left-16 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="py-2">
              <button
                onClick={() => {
                  if (node.addr) onAddChild(node.addr, 'item');
                  setShowAddMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 transition-colors flex items-center space-x-3"
              >
                <span className="text-lg">📄</span>
                <div>
                  <div className="font-medium text-gray-900">Add Item</div>
                  <div className="text-xs text-gray-500">Regular content block</div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (node.addr) onAddChild(node.addr, 'bullet');
                  setShowAddMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 transition-colors flex items-center space-x-3"
              >
                <span className="text-lg">•</span>
                <div>
                  <div className="font-medium text-gray-900">Add Bullet</div>
                  <div className="text-xs text-gray-500">List item or point</div>
                </div>
              </button>

              {node.layout === 'heading' && (
                <button
                  onClick={() => {
                    if (node.addr) onAddChild(node.addr, 'section');
                    setShowAddMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center space-x-3"
                >
                  <span className="text-lg">📋</span>
                  <div>
                    <div className="font-medium text-gray-900">Add Section</div>
                    <div className="text-xs text-gray-500">New heading section</div>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Render Children with Indentation */}
      {node.children && node.children.length > 0 && (
        <div className="ml-8 space-y-2 pl-4 border-l-2 border-gray-200">
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
    </div>
  );
};
