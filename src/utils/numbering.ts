import type { Numbering, ResumeNode } from '../types';

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