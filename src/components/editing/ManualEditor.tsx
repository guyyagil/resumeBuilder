import React, { useState } from 'react';
import { useAppStore } from '../../store';
import { EditableNode } from './EditableNode';
import { AddNodeButton } from './AddNodeButton';
import { JobDescriptionInput } from '../forms/JobDescriptionInput';
import type { ResumeNode } from '../../types';

export const ManualEditor: React.FC = () => {
  console.log('🔧 ManualEditor: Component rendering');
  const {
    resumeTree,
    originalResumeTree,
    applyAction,
    phase,
    resumeTitle,
    isViewingOriginal,
    setIsViewingOriginal,
    isTailoring,
    hasTailoredVersion
  } = useAppStore();
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
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

  // Determine which tree to display
  const displayTree = isViewingOriginal ? originalResumeTree : resumeTree;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Main Editing Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            {/* Job Description Input */}
            <JobDescriptionInput className="mb-4" />

            {/* Unified Status & View Toggle - Only show after first tailoring or during tailoring */}
            {(hasTailoredVersion || isTailoring) && (
              <div className={`border-2 rounded-xl p-4 mb-4 shadow-lg ${
                isTailoring
                  ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300'
                  : 'bg-white border-blue-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isTailoring ? (
                      <div className="animate-spin">
                        <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : (
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <h3 className={`text-sm font-semibold ${
                        isTailoring ? 'text-purple-900' : 'text-gray-900'
                      }`}>
                        {isTailoring
                          ? 'AI Tailoring in Progress'
                          : `Viewing: ${isViewingOriginal ? 'Original Resume' : 'Tailored Resume'}`
                        }
                      </h3>
                      <p className={`text-xs ${
                        isTailoring ? 'text-purple-700' : 'text-gray-600'
                      }`}>
                        {isTailoring
                          ? 'Optimizing your resume for the target job...'
                          : isViewingOriginal
                            ? 'Your original uploaded resume'
                            : 'AI-tailored version for target job'
                        }
                      </p>
                    </div>
                  </div>
                  {!isTailoring && hasTailoredVersion && (
                    <button
                      onClick={() => setIsViewingOriginal(!isViewingOriginal)}
                      className="px-4 py-2 rounded-lg font-semibold transition-all shadow-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                    >
                      {isViewingOriginal ? 'View Tailored' : 'View Original'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Resume Content Editor */}
          <div className="space-y-4">
            {displayTree.length === 0 ? (
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
                {phase !== 'processing' && !isViewingOriginal && (
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
                {isViewingOriginal && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg">
                    <p className="text-amber-800 text-sm font-medium">
                      📌 You are viewing the original resume in read-only mode. Switch to tailored view to make edits.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {displayTree.map((node: ResumeNode) => (
                    <EditableNode
                      key={node.uid}
                      node={node}
                      depth={0}
                      onUpdate={isViewingOriginal ? () => {} : handleNodeUpdate}
                      onRemove={isViewingOriginal ? () => {} : handleNodeRemove}
                      onMove={isViewingOriginal ? () => {} : handleNodeMove}
                      onAddChild={isViewingOriginal ? () => {} : handleAddNode}
                      draggedNode={draggedNode}
                      setDraggedNode={setDraggedNode}
                    />
                  ))}
                </div>

                {/* Add Section Button - Only in tailored view */}
                {!isViewingOriginal && (
                  <div className="mt-6 pt-6 border-t-2 border-blue-200">
                    <AddNodeButton
                      onAdd={() => handleAddNode('0')}
                      label="Add Section"
                      icon="section"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};