// Action Handler - Complete implementation per architecture specification
// Handles all 8 action types for resume tree modifications

import type { AgentAction, ResumeNode, Numbering, ReplaceAction, AppendBulletAction, AppendItemAction, AppendSectionAction, RemoveAction, MoveAction, ReorderAction, UpdateMetaAction } from '../types';
import { findNodeByUid, findParentByChildUid, generateUid, cloneTree } from '../utils/treeUtils';
import { resolveAddress } from '../utils/numbering';

export class ActionHandler {
  constructor(
    private tree: ResumeNode[],
    private numbering: Numbering
  ) {}

  /**
   * Apply an action to the tree and return the modified tree
   * @param action - The action to apply
   * @returns Modified tree
   */
  apply(action: AgentAction): ResumeNode[] {
    console.log(`🔧 Applying action:`, action);
    
    // Validate action structure
    this.validateAction(action);
    
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

  /**
   * Validate action structure before processing
   */
  private validateAction(action: AgentAction): void {
    if (!action.action) {
      throw new Error('Action missing required "action" field');
    }

    switch (action.action) {
      case 'appendSection':
        if (!(action as AppendSectionAction).title) {
          throw new Error('appendSection missing required "title" field');
        }
        break;
      case 'appendItem':
        const itemAction = action as AppendItemAction;
        if (!itemAction.id) {
          throw new Error('appendItem missing required "id" field');
        }
        if (!itemAction.title) {
          throw new Error('appendItem missing required "title" field');
        }
        break;
      case 'appendBullet':
        const bulletAction = action as AppendBulletAction;
        if (!bulletAction.id) {
          throw new Error('appendBullet missing required "id" field');
        }
        if (!bulletAction.text) {
          throw new Error('appendBullet missing required "text" field');
        }
        break;
    }
  }

  /**
   * Handle replace action - update content of existing node
   */
  private handleReplace(tree: ResumeNode[], action: ReplaceAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const node = findNodeByUid(tree, uid);
    if (!node) throw new Error(`Node not found: ${action.id}`);
    
    node.content = action.text;
    node.title = action.text;
    return tree;
  }

  /**
   * Handle appendBullet action - add bullet to existing item
   */
  private handleAppendBullet(tree: ResumeNode[], action: AppendBulletAction): ResumeNode[] {
    console.log(`🔸 Attempting to add bullet "${action.text}" to parent ${action.id}`);
    console.log('Current numbering:', Object.keys(this.numbering.addrToUid));
    
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) {
      console.warn(`❌ Address ${action.id} not found in numbering, attempting to find parent by pattern`);
      console.warn(`❌ Skipping bullet: "${action.text}" - parent ${action.id} not found`);
      return tree;
    }
    
    const parent = findNodeByUid(tree, uid);
    if (!parent) {
      console.warn(`❌ Parent node not found for ${action.id}, skipping bullet: "${action.text}"`);
      return tree;
    }
    
    console.log(`✅ Found parent for ${action.id}: "${parent.title}"`);
    
    if (!parent.children) parent.children = [];
    
    parent.children.push({
      uid: generateUid(),
      title: action.text,
      content: action.text,
      meta: { type: 'bullet' }
    });
    
    console.log(`✅ Added bullet to ${action.id}: "${action.text}"`);
    return tree;
  }

  /**
   * Handle appendItem action - add new item to section
   */
  private handleAppendItem(tree: ResumeNode[], action: AppendItemAction): ResumeNode[] {
    console.log(`🔹 Attempting to add item "${action.title}" to parent ${action.id}`);
    console.log('Current numbering:', Object.keys(this.numbering.addrToUid));
    
    // Special handling for root-level items (for contact info during initialization)
    if (action.id === 'root' || !this.numbering.addrToUid[action.id]) {
      console.log(`📍 Adding item to root: "${action.title}"`);
      tree.push({
        uid: generateUid(),
        title: action.title,
        content: action.content,
        meta: { type: 'item', ...action.meta },
        children: []
      });
      return tree;
    }
    
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const parent = findNodeByUid(tree, uid);
    if (!parent) throw new Error(`Parent not found: ${action.id}`);
    
    console.log(`✅ Found parent for ${action.id}: "${parent.title}"`);
    
    if (!parent.children) parent.children = [];
    
    parent.children.push({
      uid: generateUid(),
      title: action.title,
      content: action.content,
      meta: { type: 'item', ...action.meta },
      children: []
    });
    
    console.log(`✅ Added item to ${action.id}: "${action.title}"`);
    return tree;
  }

  /**
   * Handle appendSection action - create new top-level section
   */
  private handleAppendSection(tree: ResumeNode[], action: AppendSectionAction): ResumeNode[] {
    console.log(`🔷 Creating section: "${action.title}"`);

    const newSection: ResumeNode = {
      uid: generateUid(),
      title: action.title,
      layout: action.layout,
      meta: { type: 'section' },
      children: []
    };
    
    if (action.after) {
      const afterUid = resolveAddress(action.after, this.numbering);
      if (!afterUid) throw new Error(`Invalid after address: ${action.after}`);
      
      const index = tree.findIndex(n => n.uid === afterUid);
      if (index === -1) throw new Error(`Section not found: ${action.after}`);
      
      tree.splice(index + 1, 0, newSection);
    } else {
      tree.push(newSection);
    }
    
    console.log(`✅ Created section: "${action.title}"`);
    return tree;
  }

  /**
   * Handle remove action - delete node and its children
   */
  private handleRemove(tree: ResumeNode[], action: RemoveAction): ResumeNode[] {
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

  /**
   * Handle move action - relocate node to new parent
   */
  private handleMove(tree: ResumeNode[], action: MoveAction): ResumeNode[] {
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

  /**
   * Handle reorder action - change order of sibling nodes
   */
  private handleReorder(tree: ResumeNode[], action: ReorderAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const parent = findNodeByUid(tree, uid);
    if (!parent || !parent.children) {
      throw new Error(`Parent with children not found: ${action.id}`);
    }
    
    // Convert order addresses to UIDs
    const orderUids = action.order.map(addr => {
      const u = resolveAddress(addr, this.numbering);
      if (!u) throw new Error(`Invalid order address: ${addr}`);
      return u;
    });
    
    // Reorder children
    const newChildren: ResumeNode[] = [];
    orderUids.forEach(orderUid => {
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

  /**
   * Handle updateMeta action - modify node metadata
   */
  private handleUpdateMeta(tree: ResumeNode[], action: UpdateMetaAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);
    
    const node = findNodeByUid(tree, uid);
    if (!node) throw new Error(`Node not found: ${action.id}`);
    
    node.meta = { ...node.meta, ...action.meta };
    return tree;
  }
}
