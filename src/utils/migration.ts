// Migration utilities for converting legacy data to unified node system
// Provides backward compatibility during transition

import type { ResumeNode, LayoutKind, StyleHints, AgentAction } from '../types';
import { generateUid } from './treeUtils';

// =============================================================================
// LEGACY TYPE DEFINITIONS (for migration only)
// =============================================================================

interface LegacyNode {
  uid: string;
  addr?: string;
  content: string;
  layout?: string;
  style?: any;
  meta?: Record<string, any>;
  children?: LegacyNode[];
}

interface LegacySectionNode extends LegacyNode {
  type: 'section';
  title: string;
}

interface LegacyItemNode extends LegacyNode {
  type: 'item';
  title: string;
  bullets?: string[];
}

interface LegacyBulletNode extends LegacyNode {
  type: 'bullet';
  text: string;
}

// =============================================================================
// DATA MIGRATION FUNCTIONS
// =============================================================================

/**
 * Convert legacy section node to unified heading node
 */
export function convertSectionNode(legacyNode: LegacySectionNode): ResumeNode {
  return {
    uid: legacyNode.uid || generateUid(),
    title: legacyNode.title || legacyNode.content,
    layout: 'heading',
    style: {
      level: 1,
      weight: 'bold',
      ...convertLegacyStyle(legacyNode.style)
    },
    meta: legacyNode.meta || {},
    children: legacyNode.children ? legacyNode.children.map(convertLegacyNode) : []
  };
}

/**
 * Convert legacy item node to unified container node
 */
export function convertItemNode(legacyNode: LegacyItemNode): ResumeNode {
  const hasChildren = legacyNode.children && legacyNode.children.length > 0;
  const hasBullets = legacyNode.bullets && legacyNode.bullets.length > 0;
  
  const children: ResumeNode[] = [];
  
  // Convert existing children
  if (legacyNode.children) {
    children.push(...legacyNode.children.map(convertLegacyNode));
  }
  
  // Convert bullets to list-item children
  if (legacyNode.bullets) {
    legacyNode.bullets.forEach(bulletText => {
      children.push({
        uid: generateUid(),
        text: bulletText,
        layout: 'list-item',
        style: { listMarker: 'bullet' },
        meta: {},
        children: []
      });
    });
  }
  
  return {
    uid: legacyNode.uid || generateUid(),
    title: legacyNode.title || legacyNode.content,
    layout: hasChildren || hasBullets ? 'container' : 'paragraph',
    style: {
      level: 2,
      weight: 'semibold',
      ...convertLegacyStyle(legacyNode.style)
    },
    meta: legacyNode.meta || {},
    children
  };
}

/**
 * Convert legacy bullet node to unified list-item node
 */
export function convertBulletNode(legacyNode: LegacyBulletNode): ResumeNode {
  return {
    uid: legacyNode.uid || generateUid(),
    text: legacyNode.text || legacyNode.content,
    layout: 'list-item',
    style: {
      listMarker: 'bullet',
      ...convertLegacyStyle(legacyNode.style)
    },
    meta: legacyNode.meta || {},
    children: legacyNode.children ? legacyNode.children.map(convertLegacyNode) : []
  };
}

/**
 * Convert any legacy node to unified node
 */
export function convertLegacyNode(legacyNode: any): ResumeNode {
  // If already in new format, return as-is
  if (!legacyNode.type && (legacyNode.title !== undefined || legacyNode.text !== undefined)) {
    return legacyNode as ResumeNode;
  }
  
  // Handle legacy nodes by type
  switch (legacyNode.type) {
    case 'section':
      return convertSectionNode(legacyNode as LegacySectionNode);
    case 'item':
      return convertItemNode(legacyNode as LegacyItemNode);
    case 'bullet':
      return convertBulletNode(legacyNode as LegacyBulletNode);
    default:
      // Generic conversion for unknown types
      return convertGenericLegacyNode(legacyNode);
  }
}

/**
 * Convert generic legacy node when type is unknown
 */
function convertGenericLegacyNode(legacyNode: any): ResumeNode {
  // Try to infer layout from content and structure
  let layout: LayoutKind = 'container';
  
  if (legacyNode.content && legacyNode.content.includes(':')) {
    layout = 'key-value';
  } else if (legacyNode.children && legacyNode.children.length > 0) {
    layout = 'container';
  } else {
    layout = 'paragraph';
  }
  
  return {
    uid: legacyNode.uid || generateUid(),
    text: legacyNode.content || '',
    layout,
    style: convertLegacyStyle(legacyNode.style),
    meta: legacyNode.meta || {},
    children: legacyNode.children ? legacyNode.children.map(convertLegacyNode) : []
  };
}

/**
 * Convert legacy style object to unified style hints
 */
function convertLegacyStyle(legacyStyle: any): StyleHints {
  if (!legacyStyle) return {};
  
  const style: StyleHints = {};
  
  // Map common legacy style properties
  if (legacyStyle.fontSize) style.fontSize = legacyStyle.fontSize;
  if (legacyStyle.fontWeight) {
    if (typeof legacyStyle.fontWeight === 'number') {
      if (legacyStyle.fontWeight >= 700) style.weight = 'bold';
      else if (legacyStyle.fontWeight >= 600) style.weight = 'semibold';
      else if (legacyStyle.fontWeight >= 500) style.weight = 'medium';
      else style.weight = 'regular';
    } else {
      style.weight = legacyStyle.fontWeight as any;
    }
  }
  if (legacyStyle.color) style.color = legacyStyle.color;
  if (legacyStyle.backgroundColor) style.backgroundColor = legacyStyle.backgroundColor;
  if (legacyStyle.marginTop) style.marginTop = legacyStyle.marginTop;
  if (legacyStyle.marginBottom) style.marginBottom = legacyStyle.marginBottom;
  if (legacyStyle.paddingLeft) style.paddingLeft = legacyStyle.paddingLeft;
  if (legacyStyle.paddingRight) style.paddingRight = legacyStyle.paddingRight;
  if (legacyStyle.borderBottom) style.borderBottom = legacyStyle.borderBottom;
  if (legacyStyle.lineHeight) style.lineHeight = legacyStyle.lineHeight;
  if (legacyStyle.textAlign) style.align = legacyStyle.textAlign;
  if (legacyStyle.fontStyle === 'italic') style.italic = true;
  
  return style;
}

/**
 * Migrate entire legacy tree to unified format
 */
export function migrateLegacyTree(legacyTree: any[]): ResumeNode[] {
  return legacyTree.map(convertLegacyNode);
}

// =============================================================================
// ACTION MIGRATION FUNCTIONS
// =============================================================================

/**
 * Convert legacy appendSection action to new appendChild action
 */
export function migrateAppendSection(title: string, parentAddr?: string): AgentAction {
  return {
    action: 'appendChild',
    parent: parentAddr || '1',
    node: {
      title,
      layout: 'heading',
      style: { level: 1, weight: 'bold' }
    }
  };
}

/**
 * Convert legacy appendItem action to new appendChild action
 */
export function migrateAppendItem(
  parentAddr: string, 
  title: string, 
  meta?: Record<string, any>
): AgentAction {
  return {
    action: 'appendChild',
    parent: parentAddr,
    node: {
      title,
      layout: 'container',
      meta: meta || {}
    }
  };
}

/**
 * Convert legacy appendBullet action to new appendChild action
 */
export function migrateAppendBullet(parentAddr: string, text: string): AgentAction {
  return {
    action: 'appendChild',
    parent: parentAddr,
    node: {
      text,
      layout: 'list-item',
      style: { listMarker: 'bullet' }
    }
  };
}

/**
 * Convert any legacy action to new unified action
 */
export function migrateLegacyAction(legacyAction: any): AgentAction {
  // If already in new format, return as-is
  if (legacyAction.action === 'appendChild' || 
      legacyAction.action === 'insertSibling' ||
      legacyAction.action === 'replaceText' ||
      legacyAction.action === 'update' ||
      legacyAction.action === 'move' ||
      legacyAction.action === 'remove' ||
      legacyAction.action === 'reorder') {
    return legacyAction;
  }
  
  // Handle legacy action types
  switch (legacyAction.action) {
    case 'append':
      return {
        action: 'appendChild',
        parent: legacyAction.parent || '1',
        node: {
          title: legacyAction.title,
          text: legacyAction.content || legacyAction.text,
          layout: mapLegacyLayout(legacyAction.layout),
          style: convertLegacyStyle(legacyAction.style),
          meta: legacyAction.meta
        }
      };
      
    case 'replace':
      return {
        action: 'replaceText',
        id: legacyAction.id,
        text: legacyAction.text
      };
      
    case 'updateMeta':
      return {
        action: 'update',
        id: legacyAction.id,
        patch: { meta: legacyAction.meta }
      };
      
    default:
      throw new Error(`Unknown legacy action type: ${legacyAction.action}`);
  }
}

/**
 * Map legacy layout types to new layout kinds
 */
function mapLegacyLayout(legacyLayout: string): LayoutKind {
  switch (legacyLayout) {
    case 'inline':
    case 'row':
      return 'grid'; // Map horizontal layouts to grid
    case 'grid':
    case 'columns':
      return 'grid';
    case 'compact':
    case 'card':
    case 'column':
      return 'container';
    default:
      return 'container';
  }
}

// =============================================================================
// MIGRATION VALIDATION
// =============================================================================

/**
 * Validate that migration preserved content integrity
 */
export function validateMigration(
  originalTree: any[], 
  migratedTree: ResumeNode[]
): { success: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check node count
  const originalCount = countLegacyNodes(originalTree);
  const migratedCount = countNodes(migratedTree);
  
  if (originalCount !== migratedCount) {
    issues.push(`Node count mismatch: original ${originalCount}, migrated ${migratedCount}`);
  }
  
  // Check content preservation (basic check)
  const originalContent = extractLegacyContent(originalTree);
  const migratedContent = extractContent(migratedTree);
  
  originalContent.forEach(content => {
    if (!migratedContent.includes(content)) {
      issues.push(`Missing content after migration: "${content}"`);
    }
  });
  
  return {
    success: issues.length === 0,
    issues
  };
}

function countLegacyNodes(tree: any[]): number {
  let count = 0;
  function walk(nodes: any[]): void {
    nodes.forEach(node => {
      count++;
      if (node.children) walk(node.children);
    });
  }
  walk(tree);
  return count;
}

function countNodes(tree: ResumeNode[]): number {
  let count = 0;
  function walk(nodes: ResumeNode[]): void {
    nodes.forEach(node => {
      count++;
      if (node.children) walk(node.children);
    });
  }
  walk(tree);
  return count;
}

function extractLegacyContent(tree: any[]): string[] {
  const content: string[] = [];
  function walk(nodes: any[]): void {
    nodes.forEach(node => {
      if (node.content) content.push(node.content);
      if (node.title) content.push(node.title);
      if (node.text) content.push(node.text);
      if (node.bullets) content.push(...node.bullets);
      if (node.children) walk(node.children);
    });
  }
  walk(tree);
  return content.filter(c => c && c.trim().length > 0);
}

function extractContent(tree: ResumeNode[]): string[] {
  const content: string[] = [];
  function walk(nodes: ResumeNode[]): void {
    nodes.forEach(node => {
      if (node.title) content.push(node.title);
      if (node.text) content.push(node.text);
      if (node.children) walk(node.children);
    });
  }
  walk(tree);
  return content.filter(c => c && c.trim().length > 0);
}