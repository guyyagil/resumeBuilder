// Resume serialization utilities for AI context
import type { ResumeNode } from '../types';
import { AddressMap } from './tree/addressMap';

/**
 * Serialize resume tree with addresses for AI chat context
 */
export function serializeResumeWithAddresses(tree: ResumeNode[]): string {
  const lines: string[] = [];

  function serializeNode(node: ResumeNode, address: string, depth: number = 0): void {
    const indent = '  '.repeat(depth);
    let line = `${indent}[${address}] `;

    const content = node.title || node.text || '(empty)';
    const truncatedContent = content.length > 100 ? content.substring(0, 97) + '...' : content;
    line += truncatedContent;

    if (node.meta && Object.keys(node.meta).length > 0) {
      const metaParts: string[] = [];
      if (node.meta.company) metaParts.push(`Company: ${node.meta.company}`);
      if (node.meta.dateRange) metaParts.push(`Date: ${node.meta.dateRange}`);
      if (node.meta.location) metaParts.push(`Location: ${node.meta.location}`);

      if (metaParts.length > 0) {
        line += ` (${metaParts.join(', ')})`;
      }
    }

    if (node.layout && node.layout !== 'paragraph') {
      line += ` [Layout: ${node.layout}]`;
    }

    lines.push(line);

    if (node.children && node.children.length > 0) {
      node.children.forEach((child, index) => {
        const childAddress = `${address}.${index + 1}`;
        serializeNode(child, childAddress, depth + 1);
      });
    }
  }

  tree.forEach((node, index) => {
    const address = `${index + 1}`;
    serializeNode(node, address, 0);
  });

  return lines.join('\n');
}

/**
 * Create a compact summary for AI context
 */
export function createResumeContextSummary(tree: ResumeNode[]): string {
  const serialized = serializeResumeWithAddresses(tree);
  const nodeCount = countNodes(tree);
  
  return `## Current Resume Structure (${nodeCount} nodes)

${serialized}

## Address Format
- Use addresses like [1], [2.1], [2.1.3] to refer to specific content
- Each address points to exactly one piece of content
- You can modify, delete, or add content relative to these addresses`;
}

/**
 * Count total nodes in tree
 */
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

/**
 * Find nodes by content search
 */
export function findNodesByContent(tree: ResumeNode[], searchText: string): Array<{node: ResumeNode, address: string}> {
  const addressMap = new AddressMap(tree);
  const results: Array<{node: ResumeNode, address: string}> = [];
  const searchLower = searchText.toLowerCase();
  
  const addresses = addressMap.getAllAddresses();
  for (const address of addresses) {
    const node = addressMap.get(address);
    if (node) {
      const content = (node.title || node.text || '').toLowerCase();
      if (content.includes(searchLower)) {
        results.push({ node, address });
      }
    }
  }
  
  return results;
}