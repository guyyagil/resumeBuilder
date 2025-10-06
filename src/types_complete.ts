// Re-export core types from types.ts
export type { ResumeNode, Numbering, NodeType, ResumeTree } from './types';

// Action type definitions used across the app
export type ReplaceAction = {
  action: 'replace';
  id: string; // Numeric address like "3.1.2"
  text: string;
};

export type AppendBulletAction = {
  action: 'appendBullet';
  id: string; // Parent item address (e.g., "3.1")
  text: string;
};

export type AppendItemAction = {
  action: 'appendItem';
  id: string; // Section address (e.g., "3.0")
  title: string;
  content?: string;
  meta?: Record<string, any>;
};

export type AppendSectionAction = {
  action: 'appendSection';
  title: string;
  after?: string; // Address of section to insert after
};

export type RemoveAction = {
  action: 'remove';
  id: string;
};

export type MoveAction = {
  action: 'move';
  id: string; // Source address
  newParent: string; // Destination parent address or 'root'
  position?: number; // Index within new parent's children
};

export type ReorderAction = {
  action: 'reorder';
  id: string;      // Parent address whose children are being reordered
  order: string[];  // New order of child addresses
};

export type UpdateMetaAction = {
  action: 'updateMeta';
  id: string;
  meta: Record<string, any>;
};

export type AgentAction =
  | ReplaceAction
  | AppendBulletAction
  | AppendItemAction
  | AppendSectionAction
  | RemoveAction
  | MoveAction
  | ReorderAction
  | UpdateMetaAction;
