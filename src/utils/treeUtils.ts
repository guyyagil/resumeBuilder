// Tree utility functions per architecture specification
// Functions for finding, manipulating, and validating tree nodes

import type { ResumeNode } from '../shared/types';

/**
 * Find a node by its UID in the tree
 * @param tree - The resume tree
 * @param uid - The UID to search for
 * @returns The node if found, null otherwise
 */
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

/**
 * Find the parent of a node by the child's UID
 * @param tree - The resume tree
 * @param childUid - The child node's UID
 * @returns Object with parent node and child's index, or null if not found
 */
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

/**
 * Deep clone a tree structure
 * @param tree - The tree to clone
 * @returns A deep copy of the tree
 */
export function cloneTree(tree: ResumeNode[]): ResumeNode[] {
  return JSON.parse(JSON.stringify(tree));
}

/**
 * Generate a unique identifier for a node
 * @returns A unique UID string
 */
export function generateUid(): string {
  return `uid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate the tree structure (legacy wrapper)
 * @param tree - The tree to validate
 * @returns Array of error messages (empty if valid)
 */
export function validateTree(tree: ResumeNode[]): string[] {
  // Import validation function dynamically to avoid circular imports
  const { validateTreeWithConstraints } = require('./validation');
  const result = validateTreeWithConstraints(tree);
  
  const messages: string[] = [];
  result.errors.forEach(error => {
    messages.push(`${error.path}: ${error.message}`);
  });
  
  return messages;
}

/**
 * Get the depth of a node in the tree
 * @param tree - The resume tree
 * @param uid - The node's UID
 * @returns The depth (0 for root level) or -1 if not found
 */
export function getNodeDepth(tree: ResumeNode[], uid: string): number {
  function walk(nodes: ResumeNode[], depth: number): number {
    for (const node of nodes) {
      if (node.uid === uid) return depth;
      if (node.children) {
        const found = walk(node.children, depth + 1);
        if (found !== -1) return found;
      }
    }
    return -1;
  }
  
  return walk(tree, 0);
}

/**
 * Count total nodes in the tree
 * @param tree - The resume tree
 * @returns Total number of nodes
 */
export function countNodes(tree: ResumeNode[]): number {
  let count = 0;
  
  function walk(nodes: ResumeNode[]): void {
    for (const node of nodes) {
      count++;
      if (node.children) {
        walk(node.children);
      }
    }
  }
  
  walk(tree);
  return count;
}
