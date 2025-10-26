// Unified Action Handler - Generic operations for all node types
// Handles all resume tree modifications through unified actions

import type { 
  AgentAction, 
  ResumeNode, 
  Numbering, 
  AppendChildAction,
  InsertSiblingAction,
  ReplaceTextAction,
  UpdateAction,
  MoveAction,
  RemoveAction,
  ReorderAction
} from '../types';
import { findNodeByUid, findParentByChildUid, generateUid, cloneTree, resolveAddress, validateAction } from './index';

export class ActionHandler {
  constructor(
    private tree: ResumeNode[],
    private numbering: Numbering
  ) { }

  /**
   * Apply an action to the tree and return the modified tree
   * @param action - The action to apply
   * @returns Modified tree
   */
  apply(action: AgentAction): ResumeNode[] {
    console.log(`🔧 Applying unified action:`, action);

    // Validate action structure
    this.validateAction(action);

    const newTree = cloneTree(this.tree);

    switch (action.action) {
      case 'appendChild':
        return this.handleAppendChild(newTree, action);
      case 'insertSibling':
        return this.handleInsertSibling(newTree, action);
      case 'replaceText':
        return this.handleReplaceText(newTree, action);
      case 'update':
        return this.handleUpdate(newTree, action);
      case 'move':
        return this.handleMove(newTree, action);
      case 'remove':
        return this.handleRemove(newTree, action);
      case 'reorder':
        return this.handleReorder(newTree, action);
      default:
        throw new Error(`Unknown action: ${(action as any).action}`);
    }
  }

  /**
   * Validate action structure before processing
   */
  private validateAction(action: AgentAction): void {
    const errors = validateAction(action);
    
    if (errors.length > 0) {
      const errorMessages = errors
        .filter(e => e.severity === 'error')
        .map(e => e.message);
        
      if (errorMessages.length > 0) {
        throw new Error(`Action validation failed: ${errorMessages.join(', ')}`);
      }
    }
  }

  /**
   * Handle appendChild action - create any block under parent
   */
  private handleAppendChild(tree: ResumeNode[], action: AppendChildAction): ResumeNode[] {
    const newNode: ResumeNode = {
      uid: generateUid(),
      title: action.node.title,
      text: action.node.text,
      layout: action.node.layout,
      style: action.node.style,
      meta: action.node.meta || {},
      children: action.node.children || []
    };

    // Handle root-level additions (parent is '0')
    if (action.parent === '0') {
      tree.push(newNode);
      const content = newNode.title || newNode.text || '(empty)';
      console.log(`✅ Appended child to root: "${content}"`);
      return tree;
    }

    // Find parent by address
    const parentUid = resolveAddress(action.parent, this.numbering);
    if (!parentUid) {
      throw new Error(`Parent ${action.parent} not found. Available addresses: ${Object.keys(this.numbering.addrToUid).join(', ')}`);
    }

    const parent = findNodeByUid(tree, parentUid);
    if (!parent) {
      throw new Error(`Parent node not found in tree: ${action.parent}`);
    }

    if (!parent.children) {
      parent.children = [];
    }

    parent.children.push(newNode);
    const content = newNode.title || newNode.text || '(empty)';
    console.log(`✅ Appended child to ${action.parent}: "${content}"`);
    return tree;
  }

  /**
   * Handle insertSibling action - insert after specified node
   */
  private handleInsertSibling(tree: ResumeNode[], action: InsertSiblingAction): ResumeNode[] {
    const newNode: ResumeNode = {
      uid: generateUid(),
      title: action.node.title,
      text: action.node.text,
      layout: action.node.layout,
      style: action.node.style,
      meta: action.node.meta || {},
      children: action.node.children || []
    };

    // Find the reference node
    const refUid = resolveAddress(action.after, this.numbering);
    if (!refUid) {
      throw new Error(`Reference node ${action.after} not found`);
    }

    const parentInfo = findParentByChildUid(tree, refUid);
    if (!parentInfo) {
      throw new Error(`Reference node parent not found: ${action.after}`);
    }

    if (parentInfo.parent === null) {
      // Insert at root level
      tree.splice(parentInfo.index + 1, 0, newNode);
    } else {
      // Insert in parent's children
      if (!parentInfo.parent.children) {
        parentInfo.parent.children = [];
      }
      parentInfo.parent.children.splice(parentInfo.index + 1, 0, newNode);
    }

    const content = newNode.title || newNode.text || '(empty)';
    console.log(`✅ Inserted sibling after ${action.after}: "${content}"`);
    return tree;
  }

  /**
   * Handle replaceText action - update text content of existing node
   */
  private handleReplaceText(tree: ResumeNode[], action: ReplaceTextAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);

    const node = findNodeByUid(tree, uid);
    if (!node) throw new Error(`Node not found: ${action.id}`);

    node.text = action.text;
    console.log(`✅ Replaced text for ${action.id}: "${action.text.substring(0, 50)}..."`);
    return tree;
  }

  /**
   * Handle update action - patch title, layout, style, meta, etc.
   */
  private handleUpdate(tree: ResumeNode[], action: UpdateAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);

    const node = findNodeByUid(tree, uid);
    if (!node) throw new Error(`Node not found: ${action.id}`);

    // Apply patch - deep merge for style and meta
    if (action.patch.title !== undefined) node.title = action.patch.title;
    if (action.patch.text !== undefined) node.text = action.patch.text;
    if (action.patch.layout !== undefined) node.layout = action.patch.layout;
    
    if (action.patch.style) {
      node.style = { ...node.style, ...action.patch.style };
    }
    
    if (action.patch.meta) {
      node.meta = { ...node.meta, ...action.patch.meta };
    }

    console.log(`✅ Updated node ${action.id} with patch:`, Object.keys(action.patch));
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

    console.log(`✅ Removed node ${action.id}`);
    return tree;
  }

  /**
   * Handle move action - relocate node to new parent
   */
  private handleMove(tree: ResumeNode[], action: MoveAction): ResumeNode[] {
    const uid = resolveAddress(action.id, this.numbering);
    const newParentUid = action.newParent === '0'
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
    console.log('🔄 Reorder: Starting reorder action', action);

    // If id is '0', reorder root level
    if (action.id === '0') {
      console.log('🔄 Reorder: Reordering root level');

      // Convert order addresses to UIDs
      const orderUids = action.order.map(addr => {
        const u = resolveAddress(addr, this.numbering);
        if (!u) throw new Error(`Invalid order address: ${addr}`);
        return u;
      });

      // Build new tree in specified order
      const newTree: ResumeNode[] = [];
      orderUids.forEach(orderUid => {
        const node = tree.find(n => n.uid === orderUid);
        if (node) newTree.push(node);
      });

      // Add any remaining nodes not in the order
      tree.forEach(node => {
        if (node.uid && !orderUids.includes(node.uid)) {
          newTree.push(node);
        }
      });

      console.log(`✅ Reordered root level: ${action.order.join(', ')}`);
      return newTree;
    }

    const uid = resolveAddress(action.id, this.numbering);
    if (!uid) throw new Error(`Invalid address: ${action.id}`);

    const parent = findNodeByUid(tree, uid);
    if (!parent) {
      throw new Error(`Parent not found: ${action.id}`);
    }

    // If parent has no children, the addresses might refer to siblings at root level
    if (!parent.children || parent.children.length === 0) {
      console.log('🔄 Reorder: Parent has no children, trying to reorder at root level');

      // Convert order addresses to UIDs and find them in root
      const orderUids = action.order.map(addr => {
        const u = resolveAddress(addr, this.numbering);
        if (!u) throw new Error(`Invalid order address: ${addr}`);
        return u;
      });

      // Check if these UIDs exist in the root level
      const foundInRoot = orderUids.map(uid => tree.find(n => n.uid === uid));

      if (foundInRoot.every(n => n !== undefined)) {
        console.log('🔄 Reorder: All nodes found in root, reordering root level');
        const newTree: ResumeNode[] = [];

        // Add nodes in the specified order
        orderUids.forEach(orderUid => {
          const node = tree.find(n => n.uid === orderUid);
          if (node) newTree.push(node);
        });

        // Add any remaining nodes not in the order
        tree.forEach(node => {
          if (node.uid && !orderUids.includes(node.uid)) {
            newTree.push(node);
          }
        });

        return newTree;
      }

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
      if (child) {
        newChildren.push(child);
      }
    });

    // Add any children not in the order list
    parent.children.forEach(child => {
      if (child.uid && !orderUids.includes(child.uid)) {
        newChildren.push(child);
      }
    });

    parent.children = newChildren;
    console.log(`✅ Reordered children of ${action.id}`);
    return tree;
  }


}

// =============================================================================
// MIGRATION ADAPTERS FOR BACKWARD COMPATIBILITY
// =============================================================================

/**
 * Legacy action adapter for backward compatibility during migration
 */
export class LegacyActionAdapter {
  /**
   * Convert legacy appendSection to new appendChild action
   */
  static adaptAppendSection(title: string, parentAddr?: string): AppendChildAction {
    return {
      action: 'appendChild',
      parent: parentAddr || '1', // Default to first section if no parent
      node: {
        title,
        layout: 'heading',
        style: { level: 1, weight: 'bold' }
      }
    };
  }

  /**
   * Convert legacy appendItem to new appendChild action
   */
  static adaptAppendItem(parentAddr: string, title: string, meta?: Record<string, any>): AppendChildAction {
    return {
      action: 'appendChild',
      parent: parentAddr,
      node: {
        title,
        layout: 'container',
        meta: meta || {}
      }
    };
  }

  /**
   * Convert legacy appendBullet to new appendChild action
   */
  static adaptAppendBullet(parentAddr: string, text: string): AppendChildAction {
    return {
      action: 'appendChild',
      parent: parentAddr,
      node: {
        text,
        layout: 'list-item',
        style: { listMarker: 'bullet' }
      }
    };
  }

  /**
   * Convert legacy append action to new appendChild action
   */
  static adaptLegacyAppend(legacyAction: any): AgentAction {
    if (legacyAction.action === 'append') {
      return {
        action: 'appendChild',
        parent: legacyAction.parent || '1',
        node: {
          title: legacyAction.title,
          text: legacyAction.content || legacyAction.text,
          layout: legacyAction.layout || 'container',
          style: legacyAction.style,
          meta: legacyAction.meta
        }
      };
    }

    if (legacyAction.action === 'replace') {
      return {
        action: 'replaceText',
        id: legacyAction.id,
        text: legacyAction.text
      };
    }

    if (legacyAction.action === 'updateMeta') {
      return {
        action: 'update',
        id: legacyAction.id,
        patch: { meta: legacyAction.meta }
      };
    }

    // Return as-is if already in new format
    return legacyAction;
  }
}