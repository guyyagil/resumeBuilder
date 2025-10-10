import React, { useState } from 'react';
import { useAppStore } from '../../../store';
import { EditableNode } from './EditableNode';
import { AddNodeButton } from './AddNodeButton';
import { SmallChatAssistant } from './SmallChatAssistant';
import type { ResumeNode } from '../../../shared/types';

export const ManualEditor: React.FC = () => {
  console.log('🔧 ManualEditor: Component rendering');
  const { resumeTree, applyAction, phase, resumeTitle, selectedBlocks, clearBlockSelection } = useAppStore();
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const autoScrollIntervalRef = React.useRef<number | null>(null);

  console.log('🔧 ManualEditor: Resume tree has', resumeTree.length, 'nodes');
  console.log('🔧 ManualEditor: Phase is', phase);
  console.log('🔧 ManualEditor: Resume title is', resumeTitle);
  console.log('🔧 ManualEditor: Full resume tree:', resumeTree);

  // Auto-scroll management
  const stopAutoScroll = React.useCallback(() => {
    if (autoScrollIntervalRef.current !== null) {
      window.clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  const getScrollContainer = React.useCallback((): HTMLElement | null => {
    let container = document.querySelector('.flex-1.overflow-y-auto') as HTMLElement;
    if (!container) {
      container = document.querySelector('[class*="overflow-y-auto"]') as HTMLElement;
    }
    if (!container) {
      container = document.querySelector('.overflow-y-auto') as HTMLElement;
    }
    return container;
  }, []);

  const startAutoScroll = React.useCallback((direction: 'up' | 'down', speed: number) => {
    if (autoScrollIntervalRef.current !== null) {
      return;
    }

    const scrollContainer = getScrollContainer();
    if (!scrollContainer) {
      return;
    }

    autoScrollIntervalRef.current = window.setInterval(() => {
      if (direction === 'up') {
        scrollContainer.scrollTop -= speed;
      } else {
        scrollContainer.scrollTop += speed;
      }
    }, 16);
  }, [getScrollContainer]);

  // Global drag handler to continuously monitor cursor position
  React.useEffect(() => {
    const handleGlobalDrag = (e: DragEvent) => {
      if (!draggedNode) {
        stopAutoScroll();
        return;
      }

      const EDGE_THRESHOLD = 100;
      const FAST_SCROLL_THRESHOLD = 50;
      const viewportHeight = window.innerHeight;
      const mouseY = e.clientY;

      // Top edge - scroll up
      if (mouseY < EDGE_THRESHOLD && mouseY > 0) {
        const speed = mouseY < FAST_SCROLL_THRESHOLD ? 12 : 6;
        if (autoScrollIntervalRef.current === null) {
          startAutoScroll('up', speed);
        }
      }
      // Bottom edge - scroll down
      else if (mouseY > viewportHeight - EDGE_THRESHOLD && mouseY < viewportHeight) {
        const distanceFromBottom = viewportHeight - mouseY;
        const speed = distanceFromBottom < FAST_SCROLL_THRESHOLD ? 12 : 6;
        if (autoScrollIntervalRef.current === null) {
          startAutoScroll('down', speed);
        }
      }
      // Not near edges - stop scrolling
      else {
        stopAutoScroll();
      }
    };

    const handleGlobalDragEnd = () => {
      stopAutoScroll();
    };

    if (draggedNode) {
      document.addEventListener('drag', handleGlobalDrag);
      document.addEventListener('dragend', handleGlobalDragEnd);
      document.addEventListener('drop', handleGlobalDragEnd);
    }

    return () => {
      document.removeEventListener('drag', handleGlobalDrag);
      document.removeEventListener('dragend', handleGlobalDragEnd);
      document.removeEventListener('drop', handleGlobalDragEnd);
      stopAutoScroll();
    };
  }, [draggedNode, startAutoScroll, stopAutoScroll]);

  const handleNodeUpdate = (nodeId: string, updates: any) => {
    if (!nodeId) {
      console.error('❌ Cannot update node: nodeId is empty');
      return;
    }

    console.log('🔧 Updating node:', nodeId, 'with updates:', updates);

    try {
      applyAction({
        action: 'update',
        id: nodeId,
        patch: updates
      }, `Updated node ${nodeId}`);
    } catch (error) {
      console.error('❌ Failed to update node:', error);
    }
  };

  const handleNodeRemove = (nodeId: string) => {
    if (!nodeId) {
      console.error('❌ Cannot remove node: nodeId is empty');
      return;
    }

    console.log('🗑️ Removing node:', nodeId);

    try {
      applyAction({
        action: 'remove',
        id: nodeId
      }, `Removed node ${nodeId}`);
    } catch (error) {
      console.error('❌ Failed to remove node:', error);
    }
  };

  const handleNodeMove = (nodeId: string, newParent: string, position: number) => {
    if (!nodeId) {
      console.error('❌ Cannot move node: nodeId is empty');
      return;
    }

    console.log('🔄 Moving node:', nodeId, 'to parent:', newParent, 'at position:', position);

    try {
      applyAction({
        action: 'move',
        id: nodeId,
        newParent,
        position
      }, `Moved node ${nodeId}`);
    } catch (error) {
      console.error('❌ Failed to move node:', error);
    }
  };

  const handleAddNode = (parentId: string, nodeType: 'section' | 'item' | 'bullet') => {
    console.log('🔧 Adding node:', nodeType, 'to parent:', parentId);

    const nodeConfig = {
      section: { layout: 'heading' as const, text: 'New Section', style: { level: 1, weight: 'bold' as const } },
      item: { layout: 'container' as const, text: 'New Item', style: { weight: 'semibold' as const } },
      bullet: { layout: 'list-item' as const, text: 'New bullet point', style: { listMarker: 'bullet' as const } }
    };

    try {
      // For root level additions, use appendChild with empty parent
      if (parentId === 'root') {
        applyAction({
          action: 'appendChild',
          parent: '', // Empty string for root level
          node: nodeConfig[nodeType]
        }, `Added new ${nodeType} at root level`);
      } else {
        applyAction({
          action: 'appendChild',
          parent: parentId,
          node: nodeConfig[nodeType]
        }, `Added new ${nodeType}`);
      }
    } catch (error) {
      console.error('❌ Failed to add node:', error);
    }
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Main Editing Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            
            {/* Selected Blocks Indicator */}
            {selectedBlocks.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 mb-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-blue-900 font-bold text-lg">
                        {selectedBlocks.length} block{selectedBlocks.length > 1 ? 's' : ''} selected
                      </span>
                      <p className="text-blue-700 text-sm">
                        Ready for AI assistance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={clearBlockSelection}
                      className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resume Content Editor */}
          <div className="space-y-4">
            {resumeTree.length === 0 ? (
              <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200">
                <div className="mb-6">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {phase === 'welcome' ? 'Start Building' :
                     phase === 'processing' ? 'Processing...' :
                     'No Content Yet'}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {phase === 'welcome' ? 'Upload a PDF or create your resume from scratch' :
                     phase === 'processing' ? 'Analyzing your resume structure...' :
                     'Upload a new resume or add content manually'}
                  </p>
                </div>
                {phase !== 'processing' && (
                  <div className="max-w-xs mx-auto">
                    <AddNodeButton
                      onAdd={() => handleAddNode('root', 'section')}
                      label="Add First Section"
                      icon="section"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-6">
                <div className="space-y-3">
                  {resumeTree.map((node: ResumeNode) => (
                    <EditableNode
                      key={node.uid}
                      node={node}
                      depth={0}
                      onUpdate={handleNodeUpdate}
                      onRemove={handleNodeRemove}
                      onMove={handleNodeMove}
                      onAddChild={handleAddNode}
                      draggedNode={draggedNode}
                      setDraggedNode={setDraggedNode}
                    />
                  ))}
                </div>

                {/* Add Section Button */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <AddNodeButton
                    onAdd={() => handleAddNode('root', 'section')}
                    label="Add Section"
                    icon="section"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Small Chat Assistant */}
      {showChat && (
        <div className="w-80 border-l border-gray-200 bg-white">
          <SmallChatAssistant onClose={() => setShowChat(false)} />
        </div>
      )}
    </div>
  );
};