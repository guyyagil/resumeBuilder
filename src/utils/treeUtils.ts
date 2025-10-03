import type { ResumeNode } from '../types';

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

export function cloneTree(tree: ResumeNode[]): ResumeNode[] {
  return JSON.parse(JSON.stringify(tree));
}

export function generateUid(): string {
  return `uid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function validateTree(tree: ResumeNode[]): string[] {
  const errors: string[] = [];
  const seenUids = new Set<string>();
  
  function walk(nodes: ResumeNode[], path: string = 'root'): void {
    nodes.forEach((node, idx) => {
      const currentPath = `${path}[${idx}]`;
      
      if (!node.uid) {
        errors.push(`${currentPath}: Missing uid`);
      } else if (seenUids.has(node.uid)) {
        errors.push(`${currentPath}: Duplicate uid "${node.uid}"`);
      } else {
        seenUids.add(node.uid);
      }
      
      if (!node.title) {
        errors.push(`${currentPath}: Missing title`);
      }
      
      if (node.children) {
        walk(node.children, currentPath);
      }
    });
  }
  
  walk(tree);
  return errors;
}
