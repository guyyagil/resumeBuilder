// Complete type definitions per architecture specification
// This file ensures all required types are defined correctly

export type LayoutType =
  | 'default'      // Standard vertical list
  | 'inline'       // Horizontal inline items (for contact info)
  | 'grid'         // Grid layout (for skills)
  | 'columns'      // Multi-column layout
  | 'compact'      // Compact spacing
  | 'card';        // Card-style with border/shadow

export type ResumeNode = {
  uid: string;              // Stable unique identifier (e.g., "uid_abc123")
  addr?: string;            // Computed numeric address (e.g., "2.1.3")
  title: string;            // Node display title
  content?: string;         // Free-form text content (paragraphs, bullets, etc.)
  layout?: LayoutType;      // How to render this node's children
  meta?: {                  // Extensible metadata
    type?: NodeType;        // 'section' | 'item' | 'bullet' | 'text' | 'contact'
    dateRange?: string;     // For experience/education
    location?: string;      // For jobs/schools
    company?: string;       // For work items
    role?: string;          // For positions
    tags?: string[];        // Skill categories, keywords
    [key: string]: any;
  };
  children?: ResumeNode[];  // Nested nodes
};

export type NodeType = 
  | 'section'      // Top-level sections (Experience, Education, etc.)
  | 'item'         // Mid-level items (Job, Project, Degree)
  | 'bullet'       // Achievement/responsibility bullet point
  | 'text'         // Free-form text block
  | 'contact';     // Contact information

export type ResumeTree = ResumeNode[];  // Root is always an array

export type Numbering = {
  addrToUid: Record<string, string>;  // "2.1.3" → "uid_xyz"
  uidToAddr: Record<string, string>;  // "uid_xyz" → "2.1.3"
};

// Agent Actions - All 8 types as per specification

export type AgentAction = 
  | ReplaceAction
  | AppendBulletAction
  | AppendItemAction
  | AppendSectionAction
  | RemoveAction
  | MoveAction
  | ReorderAction
  | UpdateMetaAction;

// Replace content of existing node
export type ReplaceAction = {
  action: 'replace';
  id: string;           // Numeric address (e.g., "3.1.2")
  text: string;         // New content
};

// Add bullet to existing item
export type AppendBulletAction = {
  action: 'appendBullet';
  id: string;           // Parent item address (e.g., "3.1")
  text: string;         // Bullet content
};

// Add new item to section
export type AppendItemAction = {
  action: 'appendItem';
  id: string;           // Parent section address (e.g., "3.0")
  title: string;        // Item title
  content?: string;     // Item description
  meta?: Record<string, any>;  // Metadata (dates, location, etc.)
};

// Add new top-level section
export type AppendSectionAction = {
  action: 'appendSection';
  title: string;        // Section title
  layout?: LayoutType;  // How to render children (optional)
  after?: string;       // Insert after this address (optional)
};

// Remove node and its children
export type RemoveAction = {
  action: 'remove';
  id: string;           // Address to remove
};

// Move node to new parent
export type MoveAction = {
  action: 'move';
  id: string;           // Node to move
  newParent: string;    // Destination parent address
  position?: number;    // Index in new parent's children
};

// Reorder children of a node
export type ReorderAction = {
  action: 'reorder';
  id: string;           // Parent node address
  order: string[];      // New order of child addresses
};

// Update node metadata
export type UpdateMetaAction = {
  action: 'updateMeta';
  id: string;           // Node address
  meta: Record<string, any>;  // New/updated metadata fields
};

// Chat and History types

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  action?: AgentAction;  // The action that was applied (if any)
};

export type HistoryEntry = {
  id: string;
  tree: ResumeNode[];
  numbering: Numbering;
  timestamp: number;
  description: string;  // What changed
  action?: AgentAction;
};

// Legacy resume shapes (for conversion utilities)
export type LegacySection = {
  title: string;
  items?: Array<{
    title?: string;
    subtitle?: string;
    bullets?: string[];
    [key: string]: any;
  }>;
  bullets?: string[];
  [key: string]: any;
};

export type LegacyResume = {
  sections: LegacySection[];
  [key: string]: any;
};

// Chat message shape used by ChatMessage component
export type Message = {
  id: string;
  role?: 'user' | 'assistant' | 'system' | string;
  text?: string;
  content?: string;
  action?: any;
  error?: string;
  timestamp?: number;
  [key: string]: any;
};

