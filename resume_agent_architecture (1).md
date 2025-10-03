# Dynamic Resume Agent System - Complete Architecture Specification

## 1. System Overview

The Dynamic Resume Agent is an AI-powered system that manages resume content through a tree-based data structure with intelligent conversational updates. The system enables users to modify their resume through natural language commands, with the AI agent performing precise, trackable changes using a numbered addressing system.

### Core Principles
- **Tree-First Architecture**: All resume data is represented as a hierarchical tree structure
- **Stable Identifiers**: UIDs ensure consistency across transformations
- **Numeric Addressing**: Human-readable addresses (1.0, 2.1.3) for AI communication
- **Atomic Operations**: Each change is a discrete, reversible action
- **Conversational Interface**: Natural language commands translated to structured updates

---

## 2. Data Model

### 2.1 Core Types

```typescript
// types.ts

type ResumeNode = {
  uid: string;              // Stable unique identifier (e.g., "uid_abc123")
  addr?: string;            // Computed numeric address (e.g., "2.1.3")
  title: string;            // Node display title
  content?: string;         // Free-form text content (paragraphs, bullets, etc.)
  meta?: {                  // Extensible metadata
    type?: NodeType;        // 'section' | 'item' | 'bullet' | 'text'
    dateRange?: string;     // For experience/education
    location?: string;      // For jobs/schools
    company?: string;       // For work items
    role?: string;          // For positions
    tags?: string[];        // Skill categories, keywords
    [key: string]: any;
  };
  children?: ResumeNode[];  // Nested nodes
};

type NodeType = 
  | 'section'      // Top-level sections (Experience, Education, etc.)
  | 'item'         // Mid-level items (Job, Project, Degree)
  | 'bullet'       // Achievement/responsibility bullet point
  | 'text'         // Free-form text block
  | 'contact';     // Contact information

type ResumeTree = ResumeNode[];  // Root is always an array

type Numbering = {
  addrToUid: Record<string, string>;  // "2.1.3" → "uid_xyz"
  uidToAddr: Record<string, string>;  // "uid_xyz" → "2.1.3"
};
```

### 2.2 Tree Structure Example

```
1.0 Contact Information (section)
  1.1 Name: John Doe (text)
  1.2 Email: john@example.com (text)
  1.3 Phone: (555) 123-4567 (text)

2.0 Professional Summary (section)
  2.1 Senior software engineer... (text)

3.0 Work Experience (section)
  3.1 Acme Corp — Senior Engineer (item)
    3.1.1 Led migration to microservices... (bullet)
    3.1.2 Reduced latency by 45%... (bullet)
    3.1.3 Mentored team of 5 engineers (bullet)
  3.2 StartupXYZ — Full Stack Developer (item)
    3.2.1 Built React dashboard... (bullet)
    3.2.2 Implemented CI/CD pipeline... (bullet)

4.0 Education (section)
  4.1 BS Computer Science — MIT (item)
    4.1.1 GPA: 3.8/4.0 (bullet)
    4.1.2 Dean's List 2018-2020 (bullet)

5.0 Skills (section)
  5.1 Languages: Python, TypeScript, Go (text)
  5.2 Frameworks: React, Node.js, Django (text)
```

---

## 3. Core Utilities

### 3.1 Numbering System (`numbering.ts`)

**Purpose**: Generate and maintain bidirectional mappings between numeric addresses and UIDs.

```typescript
// numbering.ts

export function computeNumbering(tree: ResumeNode[]): Numbering {
  const addrToUid: Record<string, string> = {};
  const uidToAddr: Record<string, string> = {};
  
  function walk(nodes: ResumeNode[], prefix: number[] = []): void {
    nodes.forEach((node, idx) => {
      const addr = [...prefix, idx].join('.');
      node.addr = addr;
      addrToUid[addr] = node.uid;
      uidToAddr[node.uid] = addr;
      
      if (node.children) {
        walk(node.children, [...prefix, idx]);
      }
    });
  }
  
  walk(tree);
  return { addrToUid, uidToAddr };
}

export function resolveAddress(
  addr: string, 
  numbering: Numbering
): string | null {
  return numbering.addrToUid[addr] || null;
}

export function getAddress(
  uid: string, 
  numbering: Numbering
): string | null {
  return numbering.uidToAddr[uid] || null;
}
```

### 3.2 Tree Utilities (`treeUtils.ts`)

```typescript
// treeUtils.ts

export function findNodeByUid(
  tree: ResumeNode[], 
  uid: string
): ResumeNode | null {
  for (const node of tree) {
    if (node.uid === uid) return node;
    if (node.children) {
      const found = findNodeByUid(node.children, uid);
      if (found) return found;
    }
  }
  return null;
}

export function findParentByChildUid(
  tree: ResumeNode[], 
  childUid: string
): { parent: ResumeNode | null; index: number } | null {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].uid === childUid) {
      return { parent: null, index: i }; // Root level
    }
    if (tree[i].children) {
      const result = findParentByChildUid(tree[i].children!, childUid);
      if (result) {
        if (result.parent === null) {
          return { parent: tree[i], index: result.index };
        }
        return result;
      }
    }
  }
  return null;
}

export function cloneTree(tree: ResumeNode[]): ResumeNode[] {
  return JSON.parse(JSON.stringify(tree));
}

export function generateUid(): string {
  return `uid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function validateTree(tree: ResumeNode[]): string[] {
  const errors: string[] = [];
  const seenUids = new Set<string>();
  
  function walk(nodes: ResumeNode[], path: string = 'root'): void {
    nodes.forEach((node, idx) => {
      const currentPath = `${path}[${idx}]`;
      
      if (!node.uid) {
        errors.push(`${currentPath}: Missing uid`);
      } else if (seenUids.has(node.uid)) {
        errors.push(`${currentPath}: Duplicate uid "${node.uid}"`);
      } else {
        seenUids.add(node.uid);
      }
      
      if (!node.title) {
        errors.push(`${currentPath}: Missing title`);
      }
      
      if (node.children) {
        walk(node.children, currentPath);
      }
    });
  }
  
  walk(tree);
  return errors;
}
```

### 3.3 Legacy Conversion (`conversionUtils.ts`)

**Purpose**: Bridge between new tree format and legacy section-based format for backward compatibility.

```typescript
// conversionUtils.ts

import { Resume, Section, ResumeItem } from './legacyTypes';
import { ResumeNode } from './types';

export function treeToLegacy(tree: ResumeNode[]): Resume {
  // Extract contact info
  const contactNode = tree.find(n => n.meta?.type === 'contact');
  const personalInfo = {
    name: contactNode?.children?.find(c => c.title.includes('Name'))?.content || '',
    email: contactNode?.children?.find(c => c.title.includes('Email'))?.content || '',
    phone: contactNode?.children?.find(c => c.title.includes('Phone'))?.content || '',
    location: contactNode?.children?.find(c => c.title.includes('Location'))?.content || ''
  };
  
  // Convert sections
  const sections: Section[] = tree
    .filter(node => node.meta?.type === 'section' && node.uid !== contactNode?.uid)
    .map(sectionNode => ({
      id: sectionNode.uid,
      title: sectionNode.title,
      items: (sectionNode.children || []).map(itemNode => ({
        id: itemNode.uid,
        title: itemNode.title,
        description: itemNode.content || '',
        bullets: (itemNode.children || [])
          .map(bullet => bullet.content || bullet.title)
      }))
    }));
  
  return { personalInfo, sections };
}

export function legacyToTree(resume: Resume): ResumeNode[] {
  const tree: ResumeNode[] = [];
  
  // Create contact section
  tree.push({
    uid: generateUid(),
    title: 'Contact Information',
    meta: { type: 'contact' },
    children: [
      {
        uid: generateUid(),
        title: 'Name',
        content: resume.personalInfo.name,
        meta: { type: 'text' }
      },
      {
        uid: generateUid(),
        title: 'Email',
        content: resume.personalInfo.email,
        meta: { type: 'text' }
      },
      {
        uid: generateUid(),
        title: 'Phone',
        content: resume.personalInfo.phone,
        meta: { type: 'text' }
      }
    ]
  });
  
  // Convert sections
  resume.sections.forEach(section => {
    tree.push({
      uid: section.id || generateUid(),
      title: section.title,
      meta: { type: 'section' },
      children: section.items.map(item => ({
        uid: item.id || generateUid(),
        title: item.title,
        content: item.description,
        meta: { type: 'item' },
        children: item.bullets.map(bullet => ({
          uid: generateUid(),
          title: bullet,
          content: bullet,
          meta: { type: 'bullet' }
        }))
      }))
    });
  });
  
  return tree;
}
```

---

## 4. AI Agent Actions

### 4.1 Action Types

```typescript
// actions.ts

type AgentAction = 
  | ReplaceAction
  | AppendBulletAction
  | AppendItemAction
  | AppendSectionAction
  | RemoveAction
  | MoveAction
  | ReorderAction
  | UpdateMetaAction;

// Replace content of existing node
type ReplaceAction = {
  action: 'replace';
  id: string;           // Numeric address (e.g., "3.1.2")
  text: string;         // New content
};

// Add bullet to existing item
type AppendBulletAction = {
  action: 'appendBullet';
  id: string;           // Parent item address (e.g., "3.1")
  text: string;         // Bullet content
};

// Add new item to section
type AppendItemAction = {
  action: 'appendItem';
  id: string;           // Parent section address (e.g., "3.0")
  title: string;        // Item title
  content?: string;     // Item description
  meta?: Record<string, any>;  // Metadata (dates, location, etc.)
};

// Add new top-level section
type AppendSectionAction = {
  action: 'appendSection';
  title: string;        // Section title
  after?: string;       // Insert after this address (optional)
};

// Remove node and its children
type RemoveAction = {
  action: 'remove';
  id: string;           // Address to remove
};

// Move node to new parent
type MoveAction = {
  action: 'move';
  id: string;           // Node to move
  newParent: string;    // Destination parent address
  position?: number;    // Index in new parent's children
};

// Reorder children of a node
type ReorderAction = {
  action: 'reorder';
  id: string;           // Parent node address
  order: string[];      // New order of child addresses
};

// Update node metadata
type UpdateMetaAction = {
  action: 'updateMeta';
  id: string;           // Node address
  meta: Record<string, any>;  // New/updated metadata fields
};
```

### 4.2 Action Handler Implementation

```typescript
// actionHandler.ts

import { AgentAction, ResumeNode, Numbering } from './types';
import { 
  findNodeByUid, 
  findParentByChildUid, 
  generateUid, 
  cloneTree 
} from './treeUtils';
import { resolveAddress } from './numbering';

export class ActionHandler {
  constructor(
    private tree: ResumeNode[],
    private numbering: Numbering
  ) {}

  apply(action: AgentAction): ResumeNode[] {
    const newTree = cloneTree(this.tree);
    
    switch (action.action) {
      case 'replace':
        return this.handleReplace(newTree, action);
      case 'appendBullet':
        return this.handleAppendBullet(newTree, action);
      case 'appendItem':
        return this.handleAppendItem(newTree, action);
      case 'appendSection':
        return this.handleAppendSection(newTree, action);
      case 'remove':
        return this.handleRemove(newTree, action);
      case 'move':
        return this.handleMove(newTree, action);
      case 'reorder':
        return this.handleReorder(newTree, action);
      case 'updateMeta':
        return this.handleUpdateMeta(newTree, action);
      default:
        throw new Error(`Unknown action: ${(action as any).action}`);
    }
  }

  private handleReplace(tree: ResumeNode[], action: ReplaceAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const node = findNodeByUid(tree, uid);
    if (!node) throw new Error(`Node not found: ${action.id}`);
    
    node.content = action.text;
    node.title = action.text;
    return tree;
  }

  private handleAppendBullet(tree: ResumeNode[], action: AppendBulletAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const parent = findNodeByUid(tree, uid);
    if (!parent) throw new Error(`Parent not found: ${action.id}`);
    
    if (!parent.children) parent.children = [];
    
    parent.children.push({
      uid: generateUid(),
      title: action.text,
      content: action.text,
      meta: { type: 'bullet' }
    });
    
    return tree;
  }

  private handleAppendItem(tree: ResumeNode[], action: AppendItemAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const parent = findNodeByUid(tree, uid);
    if (!parent) throw new Error(`Parent not found: ${action.id}`);
    
    if (!parent.children) parent.children = [];
    
    parent.children.push({
      uid: generateUid(),
      title: action.title,
      content: action.content,
      meta: { type: 'item', ...action.meta },
      children: []
    });
    
    return tree;
  }

  private handleAppendSection(tree: ResumeNode[], action: AppendSectionAction): ResumeNode[] {
    const newSection: ResumeNode = {
      uid: generateUid(),
      title: action.title,
      meta: { type: 'section' },
      children: []
    };
    
    if (action.after) {
      const afterUid = resolveAddress(action.after, this.numbering);
      if (!afterUid) throw new Error(`Invalid after address: ${action.after}`);
      
      const index = tree.findIndex(n => n.uid === afterUid);
      if (index === -1) throw new Error(`Section not found: ${action.after}`);
      
      tree.splice(index + 1, 0, newSection);
    } else {
      tree.push(newSection);
    }
    
    return tree;
  }

  private handleRemove(tree: ResumeNode[], action: RemoveAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const parentInfo = findParentByChildUid(tree, uid);
    if (!parentInfo) throw new Error(`Node not found: ${action.id}`);
    
    if (parentInfo.parent === null) {
      // Root level
      tree.splice(parentInfo.index, 1);
    } else {
      // Nested
      parentInfo.parent.children!.splice(parentInfo.index, 1);
    }
    
    return tree;
  }

  private handleMove(tree: ResumeNode[], action: MoveAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    const newParentUid = action.newParent === 'root' 
      ? null 
      : resolveAddress(action.newParent, this.numbering);
    
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    // Find and remove node from current location
    const parentInfo = findParentByChildUid(tree, uid);
    if (!parentInfo) throw new Error(`Node not found: ${action.id}`);
    
    let node: ResumeNode;
    if (parentInfo.parent === null) {
      node = tree.splice(parentInfo.index, 1)[0];
    } else {
      node = parentInfo.parent.children!.splice(parentInfo.index, 1)[0];
    }
    
    // Insert at new location
    if (newParentUid === null) {
      // Move to root
      const pos = action.position ?? tree.length;
      tree.splice(pos, 0, node);
    } else {
      const newParent = findNodeByUid(tree, newParentUid);
      if (!newParent) throw new Error(`New parent not found: ${action.newParent}`);
      
      if (!newParent.children) newParent.children = [];
      const pos = action.position ?? newParent.children.length;
      newParent.children.splice(pos, 0, node);
    }
    
    return tree;
  }

  private handleReorder(tree: ResumeNode[], action: ReorderAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const parent = findNodeByUid(tree, uid);
    if (!parent || !parent.children) {
      throw new Error(`Parent with children not found: ${action.id}`);
    }
    
    // Convert order addresses to UIDs
    const orderUids = action.order.map(addr => {
      const u = resolveAddress(addr, this.numbering);
      if (!u) throw new Error(`Invalid order address: ${addr}`);
      return u;
    });
    
    // Reorder children
    const newChildren: ResumeNode[] = [];
    orderUids.forEach(orderUid => {
      const child = parent.children!.find(c => c.uid === orderUid);
      if (child) newChildren.push(child);
    });
    
    // Add any children not in the order list
    parent.children.forEach(child => {
      if (!orderUids.includes(child.uid)) {
        newChildren.push(child);
      }
    });
    
    parent.children = newChildren;
    return tree;
  }

  private handleUpdateMeta(tree: ResumeNode[], action: UpdateMetaAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const node = findNodeByUid(tree, uid);
    if (!node) throw new Error(`Node not found: ${action.id}`);
    
    node.meta = { ...node.meta, ...action.meta };
    return tree;
  }
}
```

---

## 5. Prompt System

### 5.1 Resume Serialization (`prompts.ts`)

```typescript
// prompts.ts

export function serializeForLLM(tree: ResumeNode[]): string {
  const lines: string[] = [];
  
  function walk(nodes: ResumeNode[], depth: number = 0): void {
    nodes.forEach(node => {
      const indent = '  '.repeat(depth);
      const addr = node.addr || '';
      
      // Format: address + title (+ content if different)
      if (node.content && node.content !== node.title) {
        lines.push(`${indent}${addr} ${node.title}`);
        lines.push(`${indent}  ${node.content}`);
      } else {
        lines.push(`${indent}${addr} ${node.title}`);
      }
      
      if (node.children) {
        walk(node.children, depth + 1);
      }
    });
  }
  
  walk(tree);
  return lines.join('\n');
}

export function serializeWithMeta(tree: ResumeNode[]): string {
  const lines: string[] = [];
  
  function walk(nodes: ResumeNode[], depth: number = 0): void {
    nodes.forEach(node => {
      const indent = '  '.repeat(depth);
      const addr = node.addr || '';
      
      lines.push(`${indent}${addr} ${node.title}`);
      
      // Add metadata
      if (node.meta) {
        const metaStr = Object.entries(node.meta)
          .filter(([k, v]) => k !== 'type' && v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ');
        if (metaStr) {
          lines.push(`${indent}  [${metaStr}]`);
        }
      }
      
      // Add content
      if (node.content && node.content !== node.title) {
        lines.push(`${indent}  ${node.content}`);
      }
      
      if (node.children) {
        walk(node.children, depth + 1);
      }
    });
  }
  
  walk(tree);
  return lines.join('\n');
}
```

### 5.2 System Prompts

```typescript
// systemPrompts.ts

export const RESUME_AGENT_SYSTEM_PROMPT = `You are a professional resume optimization agent. Your role is to help users improve their resumes through precise, targeted modifications.

## Resume Structure
The resume is represented as a numbered tree structure where each node has a unique address:
- Format: X.Y.Z where X = section, Y = item, Z = sub-item/bullet
- Example: "3.1.2" refers to the 2nd bullet under the 1st job in the Work Experience section
- The root level (X.0) represents top-level sections
- Items within sections use X.Y addressing
- Bullets within items use X.Y.Z addressing

## Understanding Addresses
- **Sections**: 1.0, 2.0, 3.0 (top-level categories)
- **Items**: 3.1, 3.2 (jobs within Work Experience section 3.0)
- **Bullets**: 3.1.1, 3.1.2, 3.1.3 (achievements under first job)

## Your Capabilities
You can perform these actions:

### 1. replace
Change the content of an existing node.
Example: {"action": "replace", "id": "3.1.2", "text": "New bullet text"}

### 2. appendBullet
Add a new bullet point to an existing item.
Example: {"action": "appendBullet", "id": "3.1", "text": "Led team of 5 engineers"}

### 3. appendItem
Add a new item (job, project, degree) to a section.
Example: {"action": "appendItem", "id": "3.0", "title": "Google — Senior Engineer", "content": "Led infrastructure team", "meta": {"dateRange": "2023-Present", "location": "NYC"}}

### 4. appendSection
Create a new top-level section.
Example: {"action": "appendSection", "title": "Certifications", "after": "4.0"}

### 5. remove
Delete a node and all its children.
Example: {"action": "remove", "id": "3.2.1"}

### 6. move
Relocate a node to a different parent.
Example: {"action": "move", "id": "4.0", "newParent": "root", "position": 2}

### 7. reorder
Change the order of sibling nodes.
Example: {"action": "reorder", "id": "3.0", "order": ["3.2", "3.1"]}

### 8. updateMeta
Modify node metadata (dates, locations, etc.).
Example: {"action": "updateMeta", "id": "3.1", "meta": {"dateRange": "2020-2023", "location": "Remote"}}

## Response Format
ALWAYS respond with TWO parts:

1. **Explanation** (conversational): Explain what you're changing and why
2. **Action** (JSON): The structured modification to apply

Example:
"I'll strengthen that bullet point to better quantify your impact.

{
  "action": "replace",
  "id": "3.1.2",
  "text": "Reduced API latency by 60% through Redis caching and query optimization, improving UX for 2M+ daily users"
}"

## Best Practices for Resume Content
- **Action verbs**: Start bullets with Led, Implemented, Designed, Architected, etc.
- **Quantify impact**: Include metrics (%, $, time saved, team size, user count)
- **Specificity**: Name technologies, methodologies, tools
- **Results-oriented**: Focus on outcomes, not just activities
- **Concision**: Keep bullets to 1-2 lines maximum
- **Consistency**: Maintain parallel structure and past tense

## Guidelines
- One action per response unless explicitly asked for multiple changes
- Always reference nodes by numeric addresses (e.g., "3.1.2")
- Preserve formatting and structure unless asked to change
- When adding content, match existing style
- Confirm before removing potentially important information

## Context Awareness
- When a job description is provided, tailor content to match requirements
- Consider experience level when suggesting changes
- Maintain chronological order (most recent first) unless instructed otherwise
- Highlight transferable skills when career pivoting`;

export const JOB_TAILORING_SYSTEM_ADDITION = `
## Job Description Context
The user has provided this target job description:

{JOB_DESCRIPTION}

When making changes:
1. Emphasize skills and experience matching job requirements
2. Use keywords from the job description naturally
3. Highlight achievements demonstrating required competencies
4. Adjust tone to match company culture (if discernible)
5. Prioritize content most relevant to this specific role
6. Quantify achievements that align with job responsibilities`;

export const OPTIMIZATION_GUIDELINES = `
## Resume Optimization Principles

### Quantification Examples
❌ Bad: "Worked on improving the website"
✅ Good: "Increased website performance by 40% through lazy loading and code splitting, reducing bounce rate from 35% to 20%"

❌ Bad: "Responsible for managing a team"
✅ Good: "Led cross-functional team of 8 engineers delivering 3 major features ahead of schedule"

### Strong Action Verbs
- Leadership: Led, Spearheaded, Directed, Orchestrated, Championed
- Technical: Architected, Implemented, Engineered, Optimized, Designed
- Impact: Increased, Reduced, Improved, Accelerated, Streamlined
- Innovation: Pioneered, Launched, Established, Transformed, Revolutionized

### Common Weaknesses to Fix
- Vague phrases: "responsible for", "worked on", "helped with", "assisted"
- Missing metrics: No numbers, percentages, or scale indicators
- Technology-light: Not naming specific tools, languages, frameworks
- Activity vs. outcome: Describing what you did instead of what you achieved`;
```

---

## 6. Store Architecture

### 6.1 Store Structure (`useAppStore.ts`)

```typescript
// useAppStore.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ResumeNode, Numbering, AgentAction } from './types';
import { computeNumbering } from './numbering';
import { ActionHandler } from './actionHandler';
import { cloneTree, validateTree } from './treeUtils';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  action?: AgentAction;  // The action that was applied (if any)
};

type HistoryEntry = {
  id: string;
  tree: ResumeNode[];
  numbering: Numbering;
  timestamp: number;
  description: string;  // What changed
  action?: AgentAction;
};

interface AppState {
  // Core data
  resumeTree: ResumeNode[];
  numbering: Numbering;
  
  // Chat
  messages: ChatMessage[];
  jobDescription: string;
  isProcessing: boolean;
  
  // History (for undo/redo)
  history: HistoryEntry[];
  historyIndex: number;
  maxHistorySize: number;
  
  // Actions
  setResumeTree: (tree: ResumeNode[]) => void;
  applyAction: (action: AgentAction, description: string) => void;
  
  // Chat
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setJobDescription: (desc: string) => void;
  setProcessing: (processing: boolean) => void;
  clearChat: () => void;
  
  // History
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Utility
  recomputeNumbering: () => void;
  validateResume: () => string[];
}

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    // Initial state
    resumeTree: [],
    numbering: { addrToUid: {}, uidToAddr: {} },
    messages: [],
    jobDescription: '',
    isProcessing: false,
    history: [],
    historyIndex: -1,
    maxHistorySize: 50,
    
    // Set resume tree and recompute numbering
    setResumeTree: (tree) => set((state) => {
      const errors = validateTree(tree);
      if (errors.length > 0) {
        console.error('Invalid tree:', errors);
        throw new Error(`Invalid tree structure: ${errors.join(', ')}`);
      }
      
      state.resumeTree = cloneTree(tree);
      state.numbering = computeNumbering(state.resumeTree);
      
      // Add to history
      const entry: HistoryEntry = {
        id: `history_${Date.now()}`,
        tree: cloneTree(state.resumeTree),
        numbering: { ...state.numbering },
        timestamp: Date.now(),
        description: 'Resume loaded'
      };
      
      state.history = [entry];
      state.historyIndex = 0;
    }),
    
    // Apply an action and update history
    applyAction: (action, description) => set((state) => {
      const handler = new ActionHandler(state.resumeTree, state.numbering);
      
      try {
        const newTree = handler.apply(action);
        state.resumeTree = newTree;
        state.numbering = computeNumbering(state.resumeTree);
        
        // Add to history
        const entry: HistoryEntry = {
          id: `history_${Date.now()}`,
          tree: cloneTree(state.resumeTree),
          numbering: { ...state.numbering },
          timestamp: Date.now(),
          description,
          action
        };
        
        // Truncate future history if we're not at the end
        if (state.historyIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.historyIndex + 1);
        }
        
        state.history.push(entry);
        state.historyIndex = state.history.length - 1;
        
        // Limit history size
        if (state.history.length > state.maxHistorySize) {
          state.history = state.history.slice(-state.maxHistorySize);
          state.historyIndex = state.history.length - 1;
        }
      } catch (error) {
        console.error('Failed to apply action:', error);
        throw error;
      }
    }),
    
    // Chat actions
    addMessage: (message) => set((state) => {
      state.messages.push({
        ...message,
        id: `msg_${Date.now()}_${Math.random()}`,
        timestamp: Date.now()
      });
    }),
    
    setJobDescription: (desc) => set((state) => {
      state.jobDescription = desc;
    }),
    
    setProcessing: (processing) => set((state) => {
      state.isProcessing = processing;
    }),
    
    clearChat: () => set((state) => {
      state.messages = [];
    }),
    
    // History navigation
    undo: () => {
      const state = get();
      if (!state.canUndo()) return false;
      
      set((draft) => {
        draft.historyIndex--;
        const entry = draft.history[draft.historyIndex];
        draft.resumeTree = cloneTree(entry.tree);
        draft.numbering = { ...entry.numbering };
      });
      
      return true;
    },
    
    redo: () => {
      const state = get();
      if (!state.canRedo()) return false;
      
      set((draft) => {
        draft.historyIndex++;
        const entry = draft.history[draft.historyIndex];
        draft.resumeTree = cloneTree(entry.tree);
        draft.numbering = { ...entry.numbering };
      });
      
      return true;
    },
    
    canUndo: () => {
      const state = get();
      return state.historyIndex > 0;
    },
    
    canRedo: () => {
      const state = get();
      return state.historyIndex < state.history.length - 1;
    },
    
    // Utility
    recomputeNumbering: () => set((state) => {
      state.numbering = computeNumbering(state.resumeTree);
    }),
    
    validateResume: () => {
      const state = get();
      return validateTree(state.resumeTree);
    }
  }))
);
```

---

## 7. AI Service Layer

### 7.1 Gemini Service (`geminiService.ts`)

```typescript
// geminiService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ResumeNode, AgentAction } from './types';
import { serializeWithMeta } from './prompts';
import { 
  RESUME_AGENT_SYSTEM_PROMPT, 
  JOB_TAILORING_SYSTEM_ADDITION 
} from './systemPrompts';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });
  }
  
  async processUserMessage(
    userMessage: string,
    resumeTree: ResumeNode[],
    jobDescription?: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<{ explanation: string; action?: AgentAction }> {
    
    // Serialize resume
    const resumeText = serializeWithMeta(resumeTree);
    
    // Build system prompt
    let systemPrompt = RESUME_AGENT_SYSTEM_PROMPT;
    if (jobDescription) {
      systemPrompt += '\n\n' + JOB_TAILORING_SYSTEM_ADDITION.replace(
        '{JOB_DESCRIPTION}',
        jobDescription
      );
    }
    
    // Build conversation context
    const messages = [
      {
        role: 'user',
        parts: [{
          text: `${systemPrompt}\n\n## Current Resume:\n\n${resumeText}`
        }]
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ];
    
    try {
      const chat = this.model.startChat({ history: messages.slice(0, -1) });
      const result = await chat.sendMessage(messages[messages.length - 1].parts[0].text);
      const response = result.response.text();
      
      // Parse response
      return this.parseResponse(response);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to process request with AI');
    }
  }
  
  private parseResponse(response: string): { explanation: string; action?: AgentAction } {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      // No action, just explanation
      return { explanation: response.trim() };
    }
    
    try {
      const action = JSON.parse(jsonMatch[0]) as AgentAction;
      const explanation = response.substring(0, jsonMatch.index).trim();
      
      return { explanation, action };
    } catch (error) {
      console.error('Failed to parse action JSON:', error);
      return { explanation: response.trim() };
    }
  }
  
  async generateSuggestions(
    resumeTree: ResumeNode[],
    jobDescription?: string
  ): Promise<string[]> {
    const resumeText = serializeWithMeta(resumeTree);
    
    let prompt = `Analyze this resume and provide 3-5 specific, actionable suggestions for improvement. Focus on:
1. Quantifying achievements
2. Using stronger action verbs
3. Adding missing technical details
4. Improving clarity and impact

Resume:
${resumeText}`;
    
    if (jobDescription) {
      prompt += `\n\nJob Description:\n${jobDescription}\n\nTailor suggestions to match this role.`;
    }
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Parse suggestions (assuming numbered or bulleted list)
      const suggestions = response
        .split('\n')
        .filter(line => /^[\d\-\*]/.test(line.trim()))
        .map(line => line.replace(/^[\d\-\*\.]\s*/, '').trim())
        .filter(s => s.length > 0);
      
      return suggestions;
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return [];
    }
  }
}
```

### 7.2 Chat Controller (`chatController.ts`)

```typescript
// chatController.ts

import { useAppStore } from './useAppStore';
import { GeminiService } from './geminiService';
import { AgentAction } from './types';

export class ChatController {
  private geminiService: GeminiService;
  
  constructor(apiKey: string) {
    this.geminiService = new GeminiService(apiKey);
  }
  
  async sendMessage(userMessage: string): Promise<void> {
    const store = useAppStore.getState();
    
    // Add user message to chat
    store.addMessage({
      role: 'user',
      content: userMessage
    });
    
    store.setProcessing(true);
    
    try {
      // Get conversation history (last 10 messages)
      const history = store.messages
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Process with AI
      const result = await this.geminiService.processUserMessage(
        userMessage,
        store.resumeTree,
        store.jobDescription,
        history
      );
      
      // Add AI response
      store.addMessage({
        role: 'assistant',
        content: result.explanation,
        action: result.action
      });
      
      // Apply action if present
      if (result.action) {
        store.applyAction(result.action, this.getActionDescription(result.action));
      }
    } catch (error) {
      console.error('Chat error:', error);
      store.addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      });
    } finally {
      store.setProcessing(false);
    }
  }
  
  async getSuggestions(): Promise<string[]> {
    const store = useAppStore.getState();
    
    try {
      return await this.geminiService.generateSuggestions(
        store.resumeTree,
        store.jobDescription
      );
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }
  
  private getActionDescription(action: AgentAction): string {
    switch (action.action) {
      case 'replace':
        return `Updated content at ${action.id}`;
      case 'appendBullet':
        return `Added bullet to ${action.id}`;
      case 'appendItem':
        return `Added new item to ${action.id}`;
      case 'appendSection':
        return `Added section: ${action.title}`;
      case 'remove':
        return `Removed ${action.id}`;
      case 'move':
        return `Moved ${action.id} to ${action.newParent}`;
      case 'reorder':
        return `Reordered children of ${action.id}`;
      case 'updateMeta':
        return `Updated metadata for ${action.id}`;
      default:
        return 'Applied change';
    }
  }
}
```

---

## 8. UI Architecture

### 8.1 Component Structure

```
src/
├── components/
│   ├── Resume/
│   │   ├── ResumeView.tsx          # Main resume display
│   │   ├── ResumeSection.tsx       # Section component
│   │   ├── ResumeItem.tsx          # Item component (job, project)
│   │   ├── ResumeBullet.tsx        # Bullet point component
│   │   └── ResumeEditor.tsx        # Inline editing
│   │
│   ├── Chat/
│   │   ├── ChatInterface.tsx       # Main chat UI
│   │   ├── ChatMessage.tsx         # Individual message
│   │   ├── ChatInput.tsx           # Message input
│   │   ├── ActionPreview.tsx       # Preview of AI action
│   │   └── SuggestionsList.tsx     # AI suggestions
│   │
│   ├── Controls/
│   │   ├── UndoRedoButtons.tsx     # History controls
│   │   ├── JobDescriptionInput.tsx # Job posting input
│   │   └── ExportButton.tsx        # Export to PDF/DOCX
│   │
│   └── Layout/
│       ├── AppLayout.tsx           # Main app layout
│       ├── Sidebar.tsx             # Navigation
│       └── Header.tsx              # Top bar
```

### 8.2 Resume View Component

```typescript
// components/Resume/ResumeView.tsx

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ResumeSection } from './ResumeSection';
import { ResumeNode } from '@/types';

export const ResumeView: React.FC = () => {
  const { resumeTree, numbering } = useAppStore();
  
  return (
    <div className="resume-view max-w-4xl mx-auto p-8 bg-white shadow-lg">
      {resumeTree.map((node) => (
        <ResumeSection
          key={node.uid}
          node={node}
          numbering={numbering}
        />
      ))}
    </div>
  );
};
```

```typescript
// components/Resume/ResumeSection.tsx

import React from 'react';
import { ResumeNode, Numbering } from '@/types';
import { ResumeItem } from './ResumeItem';

interface Props {
  node: ResumeNode;
  numbering: Numbering;
}

export const ResumeSection: React.FC<Props> = ({ node, numbering }) => {
  const isContactSection = node.meta?.type === 'contact';
  
  if (isContactSection) {
    return (
      <div className="mb-6">
        <div className="text-center">
          {node.children?.map((child) => (
            <div key={child.uid} className="text-sm text-gray-600">
              {child.content || child.title}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold border-b-2 border-gray-800 pb-2 mb-4">
        {node.title}
      </h2>
      
      {node.content && (
        <p className="mb-4 text-gray-700">{node.content}</p>
      )}
      
      {node.children?.map((child) => (
        <ResumeItem
          key={child.uid}
          node={child}
          numbering={numbering}
        />
      ))}
    </section>
  );
};
```

```typescript
// components/Resume/ResumeItem.tsx

import React from 'react';
import { ResumeNode, Numbering } from '@/types';
import { ResumeBullet } from './ResumeBullet';

interface Props {
  node: ResumeNode;
  numbering: Numbering;
}

export const ResumeItem: React.FC<Props> = ({ node, numbering }) => {
  const { meta } = node;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{node.title}</h3>
        {meta?.dateRange && (
          <span className="text-sm text-gray-600 italic">
            {meta.dateRange}
          </span>
        )}
      </div>
      
      {meta?.location && (
        <div className="text-sm text-gray-600 mb-2">{meta.location}</div>
      )}
      
      {node.content && (
        <p className="text-gray-700 mb-2">{node.content}</p>
      )}
      
      {node.children && node.children.length > 0 && (
        <ul className="list-disc list-inside space-y-1">
          {node.children.map((bullet) => (
            <ResumeBullet
              key={bullet.uid}
              node={bullet}
              numbering={numbering}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
```

```typescript
// components/Resume/ResumeBullet.tsx

import React, { useState } from 'react';
import { ResumeNode, Numbering } from '@/types';

interface Props {
  node: ResumeNode;
  numbering: Numbering;
}

export const ResumeBullet: React.FC<Props> = ({ node, numbering }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <li
      className="text-gray-700 relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {node.content || node.title}
      
      {isHovered && (
        <span className="absolute -left-12 text-xs text-gray-400 font-mono">
          {node.addr}
        </span>
      )}
    </li>
  );
};
```

### 8.3 Chat Interface

```typescript
// components/Chat/ChatInterface.tsx

import React, { useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatController } from '@/services/chatController';

const chatController = new ChatController(process.env.GEMINI_API_KEY!);

export const ChatInterface: React.FC = () => {
  const { messages, isProcessing } = useAppStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = async (message: string) => {
    await chatController.sendMessage(message);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-2">👋 Hi! I'm your resume assistant.</p>
            <p className="text-sm">Ask me to improve any part of your resume!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput
        onSend={handleSend}
        disabled={isProcessing}
      />
    </div>
  );
};
```

```typescript
// components/Chat/ChatMessage.tsx

import React from 'react';
import { ChatMessage as ChatMessageType } from '@/store/useAppStore';
import { ActionPreview } from './ActionPreview';

interface Props {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        
        {message.action && (
          <ActionPreview action={message.action} />
        )}
        
        <div className="text-xs mt-2 opacity-70">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
```

---

## 9. Complete Data Flow Pipeline

### 9.1 User Message → Resume Update Flow

```
1. User Input
   └─> ChatInput component captures message
   
2. Chat Controller
   └─> chatController.sendMessage(message)
       ├─> Add user message to store
       ├─> Get conversation history
       └─> Call Gemini API
   
3. AI Processing
   └─> GeminiService.processUserMessage()
       ├─> Serialize resume tree with numbering
       ├─> Build system prompt + context
       ├─> Send to Gemini API
       └─> Parse response (explanation + action JSON)
   
4. Action Application
   └─> store.applyAction(action, description)
       ├─> ActionHandler.apply(action)
       │   ├─> Resolve address → UID
       │   ├─> Find target node
       │   ├─> Apply modification
       │   └─> Return new tree
       ├─> Update store.resumeTree
       ├─> Recompute numbering
       └─> Add to history
   
5. UI Update
   └─> React re-renders
       ├─> ResumeView shows updated tree
       └─> ChatInterface shows AI response
```

### 9.2 Undo/Redo Flow

```
1. User clicks Undo
   └─> store.undo()
       ├─> Decrement historyIndex
       ├─> Load tree from history[historyIndex]
       ├─> Restore numbering
       └─> Trigger React re-render
   
2. UI Updates
   └─> ResumeView displays previous state
```

### 9.3 Export Flow

```
1. User clicks Export
   └─> ExportButton component
   
2. Tree → Legacy Conversion
   └─> treeToLegacy(resumeTree)
       └─> Convert to sections/items format
   
3. Rendering
   └─> Generate PDF/DOCX
       ├─> Use react-pdf or docx library
       └─> Download file
```

---

## 10. Error Handling & Validation

### 10.1 Tree Validation

```typescript
// Validation runs on:
// - Initial tree load
// - After each action
// - Before serialization

const errors = validateTree(tree);
if (errors.length > 0) {
  // Show user-friendly error
  // Prevent corrupted state
}
```

### 10.2 Action Validation

```typescript
// Before applying action:
// 1. Validate address exists
// 2. Validate target node type
// 3. Validate required fields
// 4. Check for circular references (move action)

if (!resolveAddress(action.id, numbering)) {
  throw new Error(`Invalid address: ${action.id}`);
}
```

### 10.3 API Error Handling

```typescript
// Gemini API failures:
try {
  const result = await geminiService.processUserMessage(...);
} catch (error) {
  // Show error message in chat
  // Don't modify resume
  // Log for debugging
}
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

```typescript
// numbering.test.ts
describe('computeNumbering', () => {
  it('assigns correct addresses to flat tree', () => {});
  it('assigns correct addresses to nested tree', () => {});
  it('creates bidirectional mappings', () => {});
});

// actionHandler.test.ts
describe('ActionHandler', () => {
  describe('replace', () => {
    it('updates node content', () => {});
    it('throws on invalid address', () => {});
  });
  
  describe('appendBullet', () => {
    it('adds bullet to item', () => {});
    it('creates children array if missing', () => {});
  });
  
  // ... test each action type
});

// treeUtils.test.ts
describe('findNodeByUid', () => {
  it('finds root node', () => {});
  it('finds nested node', () => {});
  it('returns null for missing node', () => {});
});
```

### 11.2 Integration Tests

```typescript
// Full flow tests
describe('Resume Update Flow', () => {
  it('processes user message and updates resume', async () => {
    const store = createTestStore();
    const controller = new ChatController(TEST_API_KEY);
    
    await controller.sendMessage('Make bullet 3.1.2 more impactful');
    
    expect(store.getState().resumeTree).toMatchSnapshot();
    expect(store.getState().messages).toHaveLength(2);
  });
});
```

---

## 12. Performance Considerations

### 12.1 Optimization Strategies

- **Tree Cloning**: Only clone when necessary (history, actions)
- **Numbering Cache**: Recompute only after modifications
- **Message History**: Limit conversation context to last 10 messages
- **React Memoization**: Use `React.memo` for resume components
- **Virtual Scrolling**: For long resumes (future enhancement)

### 12.2 Bundle Size

- Tree-shakeable utilities
- Lazy-load AI service
- Code-split by route

---

## 13. Security Considerations

- **API Key**: Store in environment variables, never in client code
- **Input Sanitization**: Validate all user inputs
- **XSS Prevention**: Sanitize resume content before rendering
- **Rate Limiting**: Implement on API calls
- **Data Privacy**: Resume data stays client-side (no server storage)

---

## 14. Future Enhancements

### 14.1 Planned Features

- **Templates**: Pre-built resume structures
- **ATS Optimization**: Score resume against ATS systems
- **Multi-format Export**: PDF, DOCX, LaTeX, HTML
- **Collaborative Editing**: Share resume for feedback
- **Version Branching**: Create alternate versions for different roles
- **Skills Extraction**: Auto-detect skills from job descriptions
- **Achievement Generator**: AI suggests accomplishments based on role

### 14.2 Technical Improvements

- **Persistent Storage**: IndexedDB for offline support
- **Conflict Resolution**: Handle concurrent edits
- **Performance Monitoring**: Track action application times
- **Enhanced Undo**: Selective undo (undo specific action)
- **Batch Actions**: Apply multiple changes atomically

---

## 15. Migration Path

### 15.1 From Legacy to Tree Format

```typescript
// One-time migration utility
export function migrateUserData() {
  const legacyResume = loadLegacyResume();
  const tree = legacyToTree(legacyResume);
  
  // Validate
  const errors = validateTree(tree);
  if (errors.length > 0) {
    throw new Error('Migration failed: ' + errors.join(', '));
  }
  
  // Save new format
  saveResumeTree(tree);
  
  // Mark migration complete
  localStorage.setItem('migrated_to_tree', 'true');
}
```

### 15.2 Backward Compatibility

```typescript
// Support both formats during transition
export function loadResume(): ResumeNode[] {
  const treeData = localStorage.getItem('resume_tree');
  if (treeData) {
    return JSON.parse(treeData);
  }
  
  // Fall back to legacy
  const legacyData = localStorage.getItem('resume_legacy');
  if (legacyData) {
    const legacy = JSON.parse(legacyData);
    return legacyToTree(legacy);
  }
  
  return createDefaultTree();
}
```

---

## Appendix A: Complete Type Definitions

```typescript
// Complete types.ts file

export type ResumeNode = {
  uid: string;
  addr?: string;
  title: string;
  content?: string;
  meta?: {
    type?: NodeType;
    dateRange?: string;
    location?: string;
    company?: string;
    role?: string;
    tags?: string[];
    [key: string]: any;
  };
  children?: ResumeNode[];
};

export type NodeType = 
  | 'section' 
  | 'item' 
  | 'bullet' 
  | 'text' 
  | 'contact';

export type ResumeTree = ResumeNode[];

export type Numbering = {
  addrToUid: Record<string, string>;
  uidToAddr: Record<string, string>;
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

export type ReplaceAction = {
  action: 'replace';
  id: string;
  text: string;
};

export type AppendBulletAction = {
  action: 'appendBullet';
  id: string;
  text: string;
};

export type AppendItemAction = {
  action: 'appendItem';
  id: string;
  title: string;
  content?: string;
  meta?: Record<string, any>;
};

export type AppendSectionAction = {
  action: 'appendSection';
  title: string;
  after?: string;
};

export type RemoveAction = {
  action: 'remove';
  id: string;
};

export type MoveAction = {
  action: 'move';
  id: string;
  newParent: string;
  position?: number;
};

export type ReorderAction = {
  action: 'reorder';
  id: string;
  order: string[];
};

export type UpdateMetaAction = {
  action: 'updateMeta';
  id: string;
  meta: Record<string, any>;
};
```

---

## Appendix B: Configuration

```typescript
// config.ts

export const CONFIG = {
  // AI Service
  geminiModel: 'gemini-2.0-flash-exp',
  maxTokens: 8192,
  temperature: 0.7,
  
  // History
  maxHistorySize: 50,
  
  // Chat
  maxConversationContext: 10,
  
  // UI
  autosaveInterval: 30000, // 30 seconds
  
  // Validation
  maxTreeDepth: 5,
  maxChildrenPerNode: 50,
  
  // Export
  pdfPage