// src/utils/resumeUpdateHandler.ts - Dynamic Section Pipeline

import { useAppStore } from '../store/useAppStore';
import type { ResumeDataPatch, SectionOperation } from '../types';

/**
 * Central pipeline: Apply AI-generated section operations to the store
 * Fully dynamic - no predefined sections
 */
export const handleResumeUpdates = async (
  patch: ResumeDataPatch,
  addChatMessage?: (msg: string, type: 'ai' | 'user') => void
): Promise<void> => {
  const store = useAppStore.getState();

  if (!patch || !patch.operations || patch.operations.length === 0) {
    console.warn('⚠️ No operations in patch');
    return;
  }

  console.log('📝 Processing section operations:', patch.operations);

  try {
    for (const op of patch.operations) {
      await applySectionOperation(op, store);
    }

    console.log('✅ All section operations applied successfully');
  } catch (error) {
    console.error('❌ Error applying section operations:', error);
    if (addChatMessage) {
      addChatMessage(`שגיאה בעדכון קורות החיים: ${error}`, 'ai');
    }
  }
};

/**
 * Apply a single section operation to the store
 */
const applySectionOperation = async (
  op: SectionOperation,
  store: ReturnType<typeof useAppStore.getState>
): Promise<void> => {
  console.log(`🔧 Applying operation: ${op.operation}`, op);

  switch (op.operation) {
    case 'upsert':
      if (op.section) {
        store.upsertSection(op.section);
      }
      break;

    case 'update':
      if (op.key && op.updates) {
        store.updateSection(op.key, op.updates);
      }
      break;

    case 'remove':
      if (op.key) {
        store.removeSection(op.key);
      }
      break;

    case 'replace':
      if (op.sections) {
        store.replaceSections(op.sections);
      }
      break;

    case 'append':
      if (op.key && op.data) {
        store.appendToSection(op.key, op.data);
      }
      break;

    case 'reorder':
      if (op.order) {
        store.reorderSections(op.order);
      }
      break;

    default:
      console.warn(`⚠️ Unknown operation: ${op.operation}`);
  }
};