import { useState, useCallback } from 'react';
import { useAppStore } from '../../../store';

export interface DragDropState {
  draggedNode: string | null;
  dropTarget: string | null;
  dropPosition: 'before' | 'after' | 'inside' | null;
}

export const useDragAndDrop = () => {
  const [dragState, setDragState] = useState<DragDropState>({
    draggedNode: null,
    dropTarget: null,
    dropPosition: null,
  });

  const { applyAction } = useAppStore();

  const handleDragStart = useCallback((nodeId: string) => {
    setDragState(prev => ({ ...prev, draggedNode: nodeId }));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string, position: 'before' | 'after' | 'inside') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    setDragState(prev => ({
      ...prev,
      dropTarget: targetId,
      dropPosition: position
    }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    const { draggedNode, dropTarget, dropPosition } = dragState;
    
    if (!draggedNode || !dropTarget || !dropPosition || draggedNode === dropTarget) {
      setDragState({ draggedNode: null, dropTarget: null, dropPosition: null });
      return;
    }

    try {
      switch (dropPosition) {
        case 'inside':
          // Move node as child of target
          applyAction({
            action: 'move',
            id: draggedNode,
            newParent: dropTarget,
            position: 0
          }, `Moved node into ${dropTarget}`);
          break;
          
        case 'before':
          // Insert before target (as sibling)
          applyAction({
            action: 'insertSibling',
            after: dropTarget,
            node: { text: 'temp' } // This will be replaced by the moved node
          }, `Moved node before ${dropTarget}`);
          break;
          
        case 'after':
          // Insert after target (as sibling)
          applyAction({
            action: 'insertSibling',
            after: dropTarget,
            node: { text: 'temp' }
          }, `Moved node after ${dropTarget}`);
          break;
      }
    } catch (error) {
      console.error('Failed to move node:', error);
    }

    setDragState({ draggedNode: null, dropTarget: null, dropPosition: null });
  }, [dragState, applyAction]);

  const handleDragEnd = useCallback(() => {
    setDragState({ draggedNode: null, dropTarget: null, dropPosition: null });
  }, []);

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
};