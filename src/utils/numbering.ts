// Numbering system utilities per architecture specification
// Generates and maintains bidirectional mappings between numeric addresses and UIDs

import type { ResumeNode, Numbering } from '../types';

/**
 * Compute numbering for the entire tree
 * Generates bidirectional mappings: address ↔ UID
 * @param tree - The resume tree
 * @returns Numbering object with addrToUid and uidToAddr mappings
 */
export function computeNumbering(tree: ResumeNode[]): Numbering {
  const addrToUid: Record<string, string> = {};
  const uidToAddr: Record<string, string> = {};
  
  function walk(nodes: ResumeNode[], prefix: number[] = []): void {
    nodes.forEach((node, idx) => {
      const addr = [...prefix, idx].join('.');
      node.addr = addr;
      addrToUid[addr] = node.uid;
      uidToAddr[node.uid] = addr;
      
      if (node.children && node.children.length > 0) {
        walk(node.children, [...prefix, idx]);
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
