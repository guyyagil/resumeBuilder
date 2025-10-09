// Core Resume Types - Unified Node System

/**
 * Single unified node type for all resume content
 * Presentation is controlled by layout and style, not node type
 */
export type ResumeNode = {
  uid: string;                 // Stable unique identifier
  addr?: string;               // Computed address (e.g., "2.1.3")

  // Content
  title?: string;              // Short title/heading for the block (optional)
  text?: string;               // Rich/plain text content (optional)

  // Presentation (purely visual/semantic hints)
  layout?: LayoutKind;         // How to render this block
  style?: StyleHints;          // Typography & spacing hints

  // Semantics / metadata (AI- and export-facing)
  meta?: Record<string, any>;  // e.g., dateRange, role, company, tags, etc.

  children?: ResumeNode[];     // Recursive tree
};

/**
 * Layout types determine how a node is rendered
 */
export type LayoutKind =
  | 'heading'        // Large label like section headers
  | 'paragraph'      // Text block
  | 'list-item'      // One bullet/numbered line
  | 'key-value'      // Label:value, for contacts or facts
  | 'grid'           // Multi-column container (children define cells)
  | 'container';     // Generic group (no inherent visual bullets)

/**
 * Style hints for typography and spacing
 */
export type StyleHints = {
  level?: number;              // e.g., heading level (1..4), or list nesting level
  listMarker?: 'bullet' | 'number' | 'dash' | 'none';
  indent?: number;             // px/em indentation hint
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  
  // Extended style properties
  fontSize?: string;           // e.g., "16px", "1.2em"
  color?: string;              // Text color
  backgroundColor?: string;    // Background color
  marginTop?: string;          // Spacing above
  marginBottom?: string;       // Spacing below
  paddingLeft?: string;        // Left padding
  paddingRight?: string;       // Right padding
  borderBottom?: string;       // Bottom border
  lineHeight?: string | number; // Line spacing
  
  // Extensible for additional properties
  [key: string]: any;
};

/**
 * Root resume tree type
 */
export type ResumeTree = ResumeNode[];

/**
 * Bidirectional address-to-UID mapping
 */
export type Numbering = {
  addrToUid: Record<string, string>;  // "2.1.3" → "uid_xyz"
  uidToAddr: Record<string, string>;  // "uid_xyz" → "2.1.3"
};

/**
 * Generic, address-based operations for all node types
 */
export type AgentAction =
  | AppendChildAction
  | InsertSiblingAction
  | ReplaceTextAction
  | UpdateAction
  | MoveAction
  | RemoveAction
  | ReorderAction;

/**
 * Create any block (heading, list-item, paragraph) under parent
 */
export type AppendChildAction = {
  action: 'appendChild';
  parent: string;              // Parent address
  node: Partial<ResumeNode>;   // Node properties to create
};

/**
 * Insert sibling after specified node (for linear building from PDFs)
 */
export type InsertSiblingAction = {
  action: 'insertSibling';
  after: string;               // Reference node address
  node: Partial<ResumeNode>;   // Node properties to create
};

/**
 * Convenience for updating text content only
 */
export type ReplaceTextAction = {
  action: 'replaceText';
  id: string;                  // Node address
  text: string;                // New text content
};

/**
 * Patch title, layout, style, meta, etc.
 */
export type UpdateAction = {
  action: 'update';
  id: string;                  // Node address
  patch: Partial<ResumeNode>;  // Properties to update
};

/**
 * Move node to new parent
 */
export type MoveAction = {
  action: 'move';
  id: string;                  // Node to move
  newParent: string;           // Destination parent address
  position?: number;           // Index in new parent's children
};

/**
 * Remove node and its children
 */
export type RemoveAction = {
  action: 'remove';
  id: string;                  // Address to remove
};

/**
 * Change order of sibling nodes
 */
export type ReorderAction = {
  action: 'reorder';
  id: string;                  // Parent node address
  order: string[];             // New order of child addresses
};

/**
 * Chat message type
 */
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  action?: AgentAction;        // The action that was applied (if any)
};

/**
 * History entry for undo/redo functionality
 */
export type HistoryEntry = {
  id: string;
  tree: ResumeNode[];
  numbering: Numbering;
  timestamp: number;
  description: string;         // What changed
  action?: AgentAction;
};

/**
 * Validation error types
 */
export type ValidationError = {
  type: 'missing_uid' | 'invalid_layout' | 'empty_container' | 'invalid_address' | 'missing_content';
  message: string;
  path: string;
  severity: 'error' | 'warning';
};

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
};