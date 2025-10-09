// Validation utilities for resume tree structure
import type { ResumeNode, LayoutKind, ValidationError, ValidationResult } from '../../types';

/**
 * Validate a single node
 */
export function validateNode(node: ResumeNode, path: string = 'root'): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check required fields
  if (!node.uid) {
    errors.push({
      type: 'missing_uid',
      message: 'Node missing required uid field',
      path,
      severity: 'error'
    });
  }

  if (!node.title && !node.text) {
    errors.push({
      type: 'missing_content',
      message: 'Node missing both title and text content',
      path,
      severity: 'warning'
    });
  }

  // Validate layout if present
  if (node.layout && !isValidLayoutKind(node.layout)) {
    errors.push({
      type: 'invalid_layout',
      message: `Invalid layout type: ${node.layout}`,
      path,
      severity: 'error'
    });
  }

  return errors;
}

/**
 * Validate entire tree structure
 */
export function validateTree(tree: ResumeNode[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const seenUids = new Set<string>();

  function walk(nodes: ResumeNode[], currentPath: string = 'root'): void {
    nodes.forEach((node, index) => {
      const nodePath = `${currentPath}[${index}]`;
      
      // Validate individual node
      const nodeErrors = validateNode(node, nodePath);
      nodeErrors.forEach(error => {
        if (error.severity === 'error') {
          errors.push(error);
        } else {
          warnings.push(error);
        }
      });

      // Check for duplicate UIDs
      if (node.uid) {
        if (seenUids.has(node.uid)) {
          errors.push({
            type: 'missing_uid',
            message: `Duplicate UID: ${node.uid}`,
            path: nodePath,
            severity: 'error'
          });
        } else {
          seenUids.add(node.uid);
        }
      }

      // Validate children recursively
      if (node.children && node.children.length > 0) {
        walk(node.children, nodePath);
      }
    });
  }

  walk(tree);

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate tree with constraint checking
 */
export function validateTreeWithConstraints(tree: ResumeNode[]): ValidationResult {
  const result = validateTree(tree);
  
  // Add constraint-specific validations
  const constraintErrors = validateConstraints(tree);
  result.errors.push(...constraintErrors.filter(e => e.severity === 'error'));
  result.warnings.push(...constraintErrors.filter(e => e.severity === 'warning'));
  
  result.isValid = result.errors.length === 0;
  
  return result;
}

/**
 * Validate business constraints and best practices
 */
export function validateConstraints(tree: ResumeNode[]): ValidationError[] {
  const errors: ValidationError[] = [];

  function walk(nodes: ResumeNode[], depth: number = 0, path: string = 'root'): void {
    nodes.forEach((node, index) => {
      const nodePath = `${path}[${index}]`;

      // Constraint: Heading at depth 0 should use level ≤ 2
      if (depth === 0 && node.layout === 'heading' && node.style?.level && node.style.level > 2) {
        errors.push({
          type: 'invalid_layout',
          message: `Top-level heading should use level ≤ 2, found level ${node.style.level}`,
          path: nodePath,
          severity: 'warning'
        });
      }

      // Constraint: Avoid empty container nodes
      if (node.layout === 'container' && (!node.children || node.children.length === 0) && !node.title && !node.text) {
        errors.push({
          type: 'empty_container',
          message: 'Empty container node with no content or children',
          path: nodePath,
          severity: 'warning'
        });
      }

      // Constraint: List items should not have multi-paragraph text
      if (node.layout === 'list-item' && node.text && node.text.includes('\n\n')) {
        errors.push({
          type: 'invalid_layout',
          message: 'List item contains multi-paragraph text, consider using paragraph layout',
          path: nodePath,
          severity: 'warning'
        });
      }

      // Constraint: Key-value nodes should have both title and text
      if (node.layout === 'key-value' && (!node.title || !node.text)) {
        errors.push({
          type: 'missing_content',
          message: 'Key-value node should have both title (key) and text (value)',
          path: nodePath,
          severity: 'warning'
        });
      }

      // Recurse into children
      if (node.children && node.children.length > 0) {
        walk(node.children, depth + 1, nodePath);
      }
    });
  }

  walk(tree);
  return errors;
}

/**
 * Check if a layout kind is valid
 */
function isValidLayoutKind(layout: string): layout is LayoutKind {
  const validLayouts: LayoutKind[] = [
    'heading',
    'paragraph', 
    'list-item',
    'key-value',
    'grid',
    'container'
  ];
  
  return validLayouts.includes(layout as LayoutKind);
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(result: ValidationResult): string {
  const lines: string[] = [];
  
  if (result.errors.length > 0) {
    lines.push('Errors:');
    result.errors.forEach(error => {
      lines.push(`  - ${error.path}: ${error.message}`);
    });
  }
  
  if (result.warnings.length > 0) {
    lines.push('Warnings:');
    result.warnings.forEach(warning => {
      lines.push(`  - ${warning.path}: ${warning.message}`);
    });
  }
  
  return lines.join('\n');
}