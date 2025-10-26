// Tree utility functions for resume node manipulation
import type { ResumeNode } from '../../types';

/**
 * Find a node by its UID in the tree
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
 */
export function cloneTree(tree: ResumeNode[]): ResumeNode[] {
  return JSON.parse(JSON.stringify(tree));
}

/**
 * Generate a unique identifier for a node
 */
export function generateUid(): string {
  return `uid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Ensure all nodes in the tree have UIDs (mutates tree in place)
 * This should be called after parsing AI responses to add system fields
 */
export function ensureUids(tree: ResumeNode[]): void {
  function walk(nodes: ResumeNode[]): void {
    for (const node of nodes) {
      if (!node.uid) {
        node.uid = generateUid();
      }
      if (node.children && node.children.length > 0) {
        walk(node.children);
      }
    }
  }
  walk(tree);
}

/**
 * Get the depth of a node in the tree
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

/**
 * Flatten tree to array with addresses
 */
export function flattenTree(tree: ResumeNode[]): Array<{ node: ResumeNode; address: string; depth: number }> {
  const result: Array<{ node: ResumeNode; address: string; depth: number }> = [];
  
  function walk(nodes: ResumeNode[], parentAddr: string, depth: number): void {
    nodes.forEach((node, index) => {
      const address = parentAddr ? `${parentAddr}.${index + 1}` : `${index + 1}`;
      result.push({ node, address, depth });
      
      if (node.children) {
        walk(node.children, address, depth + 1);
      }
    });
  }
  
  walk(tree, '', 0);
  return result;
}