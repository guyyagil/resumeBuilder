// Resume serialization functions for LLM prompts
// Converts tree structure into readable text format for AI processing

import type { ResumeNode } from '../types';

/**
 * Serialize resume tree for LLM with addresses
 * @param tree - The resume tree
 * @returns Formatted string representation
 */
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
      
      if (node.children && node.children.length > 0) {
        walk(node.children, depth + 1);
      }
    });
  }
  
  walk(tree);
  return lines.join('\n');
}

/**
 * Serialize resume tree with metadata for LLM
 * @param tree - The resume tree
 * @returns Formatted string with metadata included
 */
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
      
      if (node.children && node.children.length > 0) {
        walk(node.children, depth + 1);
      }
    });
  }
  
  walk(tree);
  return lines.join('\n');
}
