// Numbering system utilities per architecture specification
// Generates and maintains bidirectional mappings between numeric addresses and UIDs

import type { ResumeNode, Numbering } from '../shared/types';

/**
 * Compute numbering for the entire tree (1-based indexing)
 * Generates bidirectional mappings: address ↔ UID
 * @param tree - The resume tree
 * @returns Numbering object with addrToUid and uidToAddr mappings
 */
export function computeNumbering(tree: ResumeNode[]): Numbering {
  const addrToUid: Record<string, string> = {};
  const uidToAddr: Record<string, string> = {};

  function walk(nodes: ResumeNode[], prefix: number[] = []): void {
    nodes.forEach((node, idx) => {
      // Use 1-based indexing: add 1 to idx
      const addr = [...prefix, idx + 1].join('.');
      node.addr = addr;
      addrToUid[addr] = node.uid;
      uidToAddr[node.uid] = addr;

      if (node.children && node.children.length > 0) {
        walk(node.children, [...prefix, idx + 1]);
      }
    });
  }

  walk(tree);
  return { addrToUid, uidToAddr };
}

/**
 * Resolve a numeric address to a UID
 * @param addr - Numeric address (e.g., "3.1.2")
 * @param numbering - The numbering object
 * @returns UID string or null if not found
 */
export function resolveAddress(
  addr: string, 
  numbering: Numbering
): string | null {
  return numbering.addrToUid[addr] || null;
}

/**
 * Get the numeric address for a given UID
 * @param uid - The node's UID
 * @param numbering - The numbering object
 * @returns Numeric address or null if not found
 */
export function getAddress(
  uid: string, 
  numbering: Numbering
): string | null {
  return numbering.uidToAddr[uid] || null;
}

/**
 * Serialize resume tree for AI/LLM consumption with numbered outline
 * Top-level nodes show .0 suffix for clarity in prompts only
 * @param tree - The resume tree
 * @returns Formatted string with numbered outline
 */
export function serializeForLLM(tree: ResumeNode[]): string {
  const lines: string[] = [];
  
  function write(node: ResumeNode, depth: number): void {
    const addr = node.addr ?? '';
    const pad = '  '.repeat(depth);

    // One-line header for each block
    const title = node.title?.trim();
    const textPreview = node.text?.trim()?.split('\n')[0];
    const label = title || textPreview || '(untitled)';

    // For top-level headings in prompts, add a trailing .0 to improve readability
    const printedAddr = depth === 0 ? `${addr}.0` : addr;

    lines.push(`${pad}${printedAddr} ${label}`);

    node.children?.forEach((c) => write(c, depth + 1));
  }
  
  tree.forEach((n) => write(n, 0));
  return lines.join('\n');
}
