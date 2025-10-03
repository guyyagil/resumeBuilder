import type { AgentAction, ResumeNode, Numbering } from '../types';
import { 
  findNodeByUid, 
  findParentByChildUid, 
  generateUid, 
  cloneTree 
} from '../utils/treeUtils';
import { resolveAddress } from '../utils/numbering';

export class ActionHandler {
  constructor(
    private tree: ResumeNode[],
    private numbering: Numbering
  ) {}

  apply(action: AgentAction): ResumeNode[] {
    const newTree = cloneTree(this.tree);
    
    switch (action.action) {
      case 'replace':
        return this.handleReplace(newTree, action);
      case 'appendBullet':
        return this.handleAppendBullet(newTree, action);
      case 'appendItem':
        return this.handleAppendItem(newTree, action);
      case 'appendSection':
        return this.handleAppendSection(newTree, action);
      case 'remove':
        return this.handleRemove(newTree, action);
      case 'move':
        return this.handleMove(newTree, action);
      case 'reorder':
        return this.handleReorder(newTree, action);
      case 'updateMeta':
        return this.handleUpdateMeta(newTree, action);
      default:
        throw new Error(`Unknown action: ${(action as any).action}`);
    }
  }

  private handleReplace(tree: ResumeNode[], action: any): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const node = findNodeByUid(tree, uid);
    if (!node) throw new Error(`Node not found: ${action.id}`);
    
    node.content = action.text;
    node.title = action.text;
    return tree;
  }

  private handleAppendBullet(tree: ResumeNode[], action: any): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const parent = findNodeByUid(tree, uid);
    if (!parent) throw new Error(`Parent not found: ${action.id}`);
    
    if (!parent.children) parent.children = [];
    
    parent.children.push({
      uid: generateUid(),
      title: action.text,
      content: action.text,
      meta: { type: 'bullet' }
    });
    
    return tree;
  }

  private handleAppendItem(tree: ResumeNode[], action: any): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const parent = findNodeByUid(tree, uid);
    if (!parent) throw new Error(`Parent not found: ${action.id}`);
    
    if (!parent.children) parent.children = [];
    
    parent.children.push({
      uid: generateUid(),
      title: action.title,
      content: action.content,
      meta: { type: 'item', ...action.meta },
      children: []
    });
    
    return tree;
  }

  private handleAppendSection(tree: ResumeNode[], action: any): ResumeNode[] {
    const newSection: ResumeNode = {
      uid: generateUid(),
      title: action.title,
      meta: { type: 'section' },
      children: []
    };
    
    if (action.after) {
      const afterUid = resolveAddress(action.after, this.numbering);
      if (afterUid) {
        const index = tree.findIndex(n => n.uid === afterUid);
        if (index !== -1) {
          tree.splice(index + 1, 0, newSection);
          return tree;
        }
      }
      // If after address is invalid or not found, just append to end
      console.warn(`Section address ${action.after} not found, appending to end`);
    }
    
    // Default: append to end
    tree.push(newSection);
    return tree;
  }

  private handleRemove(tree: ResumeNode[], action: any): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const parentInfo = findParentByChildUid(tree, uid);
    if (!parentInfo) throw new Error(`Node not found: ${action.id}`);
    
    if (parentInfo.parent === null) {
      // Root level
      tree.splice(parentInfo.index, 1);
    } else {
      // Nested
      parentInfo.parent.children!.splice(parentInfo.index, 1);
    }
    
    return tree;
  }

  private handleMove(tree: ResumeNode[], action: any): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    const newParentUid = action.newParent === 'root' 
      ? null 
      : resolveAddress(action.newParent, this.numbering);
    
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    // Find and remove node from current location
    const parentInfo = findParentByChildUid(tree, uid);
    if (!parentInfo) throw new Error(`Node not found: ${action.id}`);
    
    let node: ResumeNode;
    if (parentInfo.parent === null) {
      node = tree.splice(parentInfo.index, 1)[0];
    } else {
      node = parentInfo.parent.children!.splice(parentInfo.index, 1)[0];
    }
    
    // Insert at new location
    if (newParentUid === null) {
      // Move to root
      const pos = action.position ?? tree.length;
      tree.splice(pos, 0, node);
    } else {
      const newParent = findNodeByUid(tree, newParentUid);
      if (!newParent) throw new Error(`New parent not found: ${action.newParent}`);
      
      if (!newParent.children) newParent.children = [];
      const pos = action.position ?? newParent.children.length;
      newParent.children.splice(pos, 0, node);
    }
    
    return tree;
  }

  private handleReorder(tree: ResumeNode[], action: any): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const parent = findNodeByUid(tree, uid);
    if (!parent || !parent.children) {
      throw new Error(`Parent with children not found: ${action.id}`);
    }
    
    // Convert order addresses to UIDs
    const orderUids = action.order.map((addr: string) => {
      const u = resolveAddress(addr, this.numbering);
      if (!u) throw new Error(`Invalid order address: ${addr}`);
      return u;
    });
    
    // Reorder children
    const newChildren: ResumeNode[] = [];
    orderUids.forEach((orderUid: string) => {
      const child = parent.children!.find(c => c.uid === orderUid);
      if (child) newChildren.push(child);
    });
    
    // Add any children not in the order list
    parent.children.forEach(child => {
      if (!orderUids.includes(child.uid)) {
        newChildren.push(child);
      }
    });
    
    parent.children = newChildren;
    return tree;
  }

  private handleUpdateMeta(tree: ResumeNode[], action: any): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const node = findNodeByUid(tree, uid);
    if (!node) throw new Error(`Node not found: ${action.id}`);
    
    node.meta = { ...node.meta, ...action.meta };
    return tree;
  }
}
