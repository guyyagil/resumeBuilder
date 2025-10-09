import React, { useState } from 'react';
import { useAppStore } from '../../../store';
import { EditableNode } from './EditableNode';
import { AddNodeButton } from './AddNodeButton';
import { SmallChatAssistant } from './SmallChatAssistant';
import type { ResumeNode } from '../../../shared/types';

export const ManualEditor: React.FC = () => {
  console.log('🔧 ManualEditor: Component rendering');
  const { resumeTree, applyAction, phase, resumeTitle } = useAppStore();
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  
  console.log('🔧 ManualEditor: Resume tree has', resumeTree.length, 'nodes');
  console.log('🔧 ManualEditor: Phase is', phase);
  console.log('🔧 ManualEditor: Resume title is', resumeTitle);
  console.log('🔧 ManualEditor: Full resume tree:', resumeTree);

  const handleNodeUpdate = (nodeId: string, updates: any) => {
    applyAction({
      action: 'update',
      id: nodeId,
      patch: updates
    }, `Updated node ${nodeId}`);
  };

  const handleNodeRemove = (nodeId: string) => {
    applyAction({
      action: 'remove',
      id: nodeId
    }, `Removed node ${nodeId}`);
  };

  const handleNodeMove = (nodeId: string, newParent: string, position: number) => {
    applyAction({
      action: 'move',
      id: nodeId,
      newParent,
      position
    }, `Moved node ${nodeId}`);
  };

  const handleAddNode = (parentId: string, nodeType: 'section' | 'item' | 'bullet') => {
    console.log('🔧 Adding node:', nodeType, 'to parent:', parentId);
    
    const nodeConfig = {
      section: { layout: 'heading' as const, text: 'New Section', style: { level: 1, weight: 'bold' as const } },
      item: { layout: 'container' as const, text: 'New Item', style: { weight: 'semibold' as const } },
      bullet: { layout: 'list-item' as const, text: 'New bullet point', style: { listMarker: 'bullet' as const } }
    };

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
  };

  return (
    <div className="h-full flex">
      {/* Main Editing Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">📝 Manual Resume Editor</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowChat(!showChat)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>AI Assistant</span>
              </button>
            </div>
          </div>

          {/* Resume Tree Editor */}
          <div className="space-y-4">
            {resumeTree.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {phase === 'welcome' ? 'No resume uploaded yet' : 
                     phase === 'processing' ? 'Processing your resume...' :
                     'No resume content available'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {phase === 'welcome' ? 'Upload a resume PDF to start editing, or create content manually.' :
                     phase === 'processing' ? 'Please wait while we process your resume.' :
                     'The resume data may not have loaded properly. Try uploading again or add content manually.'}
                  </p>
                  {resumeTitle && (
                    <p className="text-sm text-blue-600 mb-4">
                      Resume title detected: "{resumeTitle}"
                    </p>
                  )}
                </div>
                {phase !== 'processing' && (
                  <AddNodeButton
                    onAdd={() => handleAddNode('root', 'section')}
                    label="Add Your First Section"
                    icon="section"
                  />
                )}
              </div>
            ) : (
              <>
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
                
                {/* Add Root Section Button */}
                <AddNodeButton
                  onAdd={() => handleAddNode('root', 'section')}
                  label="Add New Section"
                  icon="section"
                />
              </>
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