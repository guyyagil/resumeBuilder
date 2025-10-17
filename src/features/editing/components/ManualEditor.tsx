import React, { useState } from 'react';
import { useAppStore } from '../../../store';
import { EditableNode } from './EditableNode';
import { AddNodeButton } from './AddNodeButton';
import { SmallChatAssistant } from './SmallChatAssistant';
import { JobDescriptionInput } from '../../../components/JobDescriptionInput';
import type { ResumeNode } from '../../../shared/types';

export const ManualEditor: React.FC = () => {
  console.log('🔧 ManualEditor: Component rendering');
  const { resumeTree, applyAction, phase, resumeTitle, selectedBlocks, clearBlockSelection } = useAppStore();
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(true); // Chat visible by default
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

  const handleAddNode = (parentId: string) => {
    console.log('🔧 Adding node to parent:', parentId);

    // Determine the appropriate layout based on depth
    // Root level (parentId === '0') gets heading layout
    // Otherwise gets container layout
    const nodeConfig = parentId === '0'
      ? { layout: 'heading' as const, title: 'New Section', style: { level: 1, weight: 'bold' as const } }
      : { layout: 'container' as const, text: 'New Block' };

    try {
      // For root level additions, use appendChild with parent '0'
      if (parentId === '0') {
        console.log('🔧 Appending to root (parent: 0)');
        applyAction({
          action: 'appendChild',
          parent: '0', // '0' represents root level
          node: nodeConfig
        }, `Added new block at root level`);
      } else {
        console.log('🔧 Appending to parent:', parentId);
        applyAction({
          action: 'appendChild',
          parent: parentId,
          node: nodeConfig
        }, `Added new child block`);
      }
      console.log('✅ Node added successfully');
    } catch (error) {
      console.error('❌ Failed to add node:', error);
      alert(`Failed to add node: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Chat Toggle Button - Fixed position */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed right-6 bottom-6 p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-2xl hover:from-blue-600 hover:to-indigo-700 transition-all z-50 group hover:scale-110 border-2 border-white"
          title="Open AI Assistant"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-blue-500">
            AI Assistant
          </span>
        </button>
      )}

      {/* Main Editing Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            {/* Job Description Input */}
            <JobDescriptionInput className="mb-4" />

            {/* Selected Blocks Indicator */}
            {selectedBlocks.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-2xl p-5 mb-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-900 font-bold text-xl">
                          {selectedBlocks.length} block{selectedBlocks.length > 1 ? 's' : ''} cited
                        </span>
                        <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-full shadow-md">
                          AI Ready
                        </span>
                      </div>
                      <p className="text-emerald-700 text-sm mt-1 flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Use the AI chat to improve, rewrite, or modify these blocks</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {!showChat && (
                      <button
                        onClick={() => setShowChat(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Open Chat</span>
                      </button>
                    )}
                    <button
                      onClick={clearBlockSelection}
                      className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-md"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resume Content Editor */}
          <div className="space-y-4">
            {resumeTree.length === 0 ? (
              <div className="text-center py-20 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-blue-200">
                <div className="mb-6">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-xl">
                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-blue-900 mb-2">
                    {phase === 'welcome' ? 'Start Building' :
                     phase === 'processing' ? 'Processing...' :
                     'No Content Yet'}
                  </h3>
                  <p className="text-blue-700 max-w-md mx-auto font-medium">
                    {phase === 'welcome' ? 'Upload a PDF or create your resume from scratch' :
                     phase === 'processing' ? 'Analyzing your resume structure...' :
                     'Upload a new resume or add content manually'}
                  </p>
                </div>
                {phase !== 'processing' && (
                  <div className="max-w-xs mx-auto">
                    <AddNodeButton
                      onAdd={() => handleAddNode('0')}
                      label="Add First Section"
                      icon="section"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-blue-200 p-6">
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
                <div className="mt-6 pt-6 border-t-2 border-blue-200">
                  <AddNodeButton
                    onAdd={() => handleAddNode('0')}
                    label="Add Section"
                    icon="section"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Chat Assistant Panel */}
      {showChat && (
        <div className="w-96 border-l-2 border-blue-300 bg-white shadow-2xl flex flex-col">
          <SmallChatAssistant onClose={() => setShowChat(false)} />
        </div>
      )}
    </div>
  );
};