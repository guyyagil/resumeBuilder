import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../../../store';

export const useInlineEdit = (nodeId: string, initialValue: string) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialValue);
  const [hasChanges, setHasChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { applyAction } = useAppStore();

  useEffect(() => {
    setEditValue(initialValue);
    setHasChanges(false);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      
      // Auto-resize textarea
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [isEditing]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditValue(initialValue);
    setIsEditing(false);
    setHasChanges(false);
  }, [initialValue]);

  const saveChanges = useCallback(() => {
    if (hasChanges && editValue.trim() !== initialValue.trim()) {
      applyAction({
        action: 'replaceText',
        id: nodeId,
        text: editValue.trim()
      }, `Updated text for ${nodeId}`);
    }
    setIsEditing(false);
    setHasChanges(false);
  }, [editValue, initialValue, hasChanges, nodeId, applyAction]);

  const handleChange = useCallback((value: string) => {
    setEditValue(value);
    setHasChanges(value.trim() !== initialValue.trim());
  }, [initialValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveChanges();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  }, [saveChanges, cancelEditing]);

  const handleBlur = useCallback(() => {
    // Small delay to allow for button clicks
    setTimeout(() => {
      if (hasChanges) {
        saveChanges();
      } else {
        setIsEditing(false);
      }
    }, 150);
  }, [hasChanges, saveChanges]);

  return {
    isEditing,
    editValue,
    hasChanges,
    textareaRef,
    startEditing,
    cancelEditing,
    saveChanges,
    handleChange,
    handleKeyDown,
    handleBlur,
  };
};