// Resume serialization functions for LLM prompts
// Converts tree structure into readable text format for AI processing

import type { ResumeNode } from '../types';
import { serializeForLLM as serializeForLLMWithAddresses } from '../utils/numbering';

/**
 * Serialize resume tree for LLM with addresses (delegates to numbering utils)
 * @param tree - The resume tree
 * @returns Formatted string representation
 */
export function serializeForLLM(tree: ResumeNode[]): string {
  return serializeForLLMWithAddresses(tree);
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

      const content = node.title || node.text || '(empty)';
      lines.push(`${indent}${addr} ${content}`);

      // Add metadata
      if (node.meta) {
        const metaStr = Object.entries(node.meta)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ');
        if (metaStr) {
          lines.push(`${indent}  [${metaStr}]`);
        }
      }

      if (node.children && node.children.length > 0) {
        walk(node.children, depth + 1);
      }
    });
  }

  walk(tree);
  return lines.join('\n');
}
