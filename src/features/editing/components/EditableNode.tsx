import React, { useState, useRef, useEffect } from 'react';
import type { ResumeNode } from '../../../shared/types';


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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editText.trim() !== (node.text || node.title || '')) {
      onUpdate(node.addr!, { 
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
    setDraggedNode(node.addr!);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedNode && draggedNode !== node.addr) {
      // Simple reordering logic - can be enhanced
      onMove(draggedNode, node.addr!, 0);
    }
    setDraggedNode(null);
  };

  const getNodeIcon = () => {
    switch (node.layout) {
      case 'heading':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'list-item':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getNodeStyle = () => {
    const baseStyle = "group relative border border-transparent hover:border-gray-300 rounded-lg p-3 transition-all duration-200";
    
    if (node.layout === 'heading') {
      return `${baseStyle} bg-blue-50 hover:bg-blue-100`;
    } else if (node.layout === 'list-item') {
      return `${baseStyle} bg-gray-50 hover:bg-gray-100 ml-6`;
    } else {
      return `${baseStyle} bg-white hover:bg-gray-50`;
    }
  };

  const getTextStyle = () => {
    if (node.layout === 'heading') {
      return "text-lg font-bold text-gray-900";
    } else if (node.layout === 'list-item') {
      return "text-sm text-gray-700";
    } else {
      return "text-base text-gray-800";
    }
  };

  return (
    <div className="relative">
      <div
        className={getNodeStyle()}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Node Content */}
        <div className="flex items-start space-x-3">
          {/* Drag Handle & Icon */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
            {getNodeIcon()}
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
                className="w-full p-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={Math.max(1, editText.split('\n').length)}
              />
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className={`${getTextStyle()} cursor-text hover:bg-gray-100 p-2 rounded min-h-[2rem] whitespace-pre-wrap`}
              >
                {node.text || node.title || 'Click to edit...'}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
              title="Add child"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              onClick={() => onRemove(node.addr!)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Remove"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Add Menu */}
        {showAddMenu && (
          <div className="absolute top-full left-12 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  onAddChild(node.addr!, 'item');
                  setShowAddMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center space-x-2"
              >
                <span>📄</span>
                <span>Add Item</span>
              </button>
              <button
                onClick={() => {
                  onAddChild(node.addr!, 'bullet');
                  setShowAddMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center space-x-2"
              >
                <span>•</span>
                <span>Add Bullet</span>
              </button>
              {node.layout === 'heading' && (
                <button
                  onClick={() => {
                    onAddChild(node.addr!, 'section');
                    setShowAddMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center space-x-2"
                >
                  <span>📋</span>
                  <span>Add Section</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Render Children */}
      {node.children && node.children.length > 0 && (
        <div className="ml-6 mt-2 space-y-2">
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