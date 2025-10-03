// prompts.ts

import type { ResumeNode } from '../types';

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
