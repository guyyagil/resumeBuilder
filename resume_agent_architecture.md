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
    maxHist