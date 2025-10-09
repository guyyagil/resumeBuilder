import type { ResumeNode } from '../shared/types';

/**
 * Fast address-to-node mapping for O(1) lookups during chat editing
 */
export class AddressMap {
  private map = new Map<string, ResumeNode>();

  constructor(tree: ResumeNode[]) {
    this.rebuild(tree);
  }

  /**
   * Rebuild the address map from the current tree
   */
  rebuild(tree: ResumeNode[]): void {
    this.map.clear();
    this.buildMap(tree, '');
  }

  private buildMap(nodes: ResumeNode[], parentAddr: string): void {
    nodes.forEach((node, index) => {
      const addr = parentAddr ? `${parentAddr}.${index + 1}` : `${index + 1}`;
      // Don't mutate node - just use computed address for mapping
      this.map.set(addr, node);

      if (node.children && node.children.length > 0) {
        this.buildMap(node.children, addr);
      }
    });
  }

  /**
   * Get node by address - O(1) lookup
   */
  get(address: string): ResumeNode | undefined {
    return this.map.get(address);
  }

  /**
   * Check if address exists
   */
  has(address: string): boolean {
    return this.map.has(address);
  }

  /**
   * Get all addresses
   */
  getAllAddresses(): string[] {
    return Array.from(this.map.keys()).sort((a, b) => {
      // Sort addresses numerically (1, 1.1, 1.2, 2, 2.1, etc.)
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;
        if (aVal !== bVal) return aVal - bVal;
      }
      return 0;
    });
  }

  /**
   * Get parent address from child address
   */
  getParentAddress(address: string): string | null {
    const parts = address.split('.');
    if (parts.length <= 1) return null;
    return parts.slice(0, -1).join('.');
  }

  /**
   * Get parent node
   */
  getParent(address: string): ResumeNode | null {
    const parentAddr = this.getParentAddress(address);
    return parentAddr ? this.get(parentAddr) || null : null;
  }

  /**
   * Get children addresses
   */
  getChildrenAddresses(address: string): string[] {
    return this.getAllAddresses().filter(addr => 
      addr.startsWith(address + '.') && 
      addr.split('.').length === address.split('.').length + 1
    );
  }

  /**
   * Get siblings addresses (same parent)
   */
  getSiblingAddresses(address: string): string[] {
    const parentAddr = this.getParentAddress(address);
    if (!parentAddr) {
      // Root level siblings
      return this.getAllAddresses().filter(addr => !addr.includes('.'));
    }
    return this.getChildrenAddresses(parentAddr);
  }
}