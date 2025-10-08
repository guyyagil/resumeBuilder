# Unified Node System Migration Guide

## Overview

The Resume Agent has been successfully migrated from a multi-type node system (section/item/bullet/text) to a unified node architecture. This migration provides better flexibility, simpler code maintenance, and enhanced AI integration.

## Key Changes

### 1. Unified Data Model
- **Before**: Multiple node types (`SectionNode`, `ItemNode`, `BulletNode`, `TextNode`)
- **After**: Single `ResumeNode` type with layout-driven presentation

### 2. New Node Structure
```typescript
type ResumeNode = {
  uid: string;                 // Stable unique identifier
  addr?: string;               // Computed address (e.g., "2.1.3")
  title?: string;              // Optional heading/label
  text?: string;               // Optional main content
  layout?: LayoutKind;         // How to render this block
  style?: StyleHints;          // Typography and spacing hints
  meta?: Record<string, any>;  // Extensible metadata
  children?: ResumeNode[];     // Recursive structure
}
```

### 3. Layout Types
- `heading`: Section headers with level styling
- `paragraph`: Text blocks
- `list-item`: Bullet points with marker types
- `key-value`: Label:value pairs (e.g., contact info)
- `grid`: Multi-column layouts
- `container`: Generic grouping (default)

### 4. New Action System
- **appendChild**: Add node under parent
- **insertSibling**: Insert after specific node
- **replaceText**: Update text content
- **update**: Modify properties (layout, style, meta)
- **move**: Relocate nodes
- **remove**: Delete nodes
- **reorder**: Change child order

### 5. AI Integration Improvements
- Numbered outline in system prompts (1.0, 2.0, 2.1, etc.)
- Address-based references for precise modifications
- Unified action format for all operations

## Migration Features

### Backward Compatibility
- Legacy action adapters maintain compatibility
- Automatic migration of old data structures
- Gradual transition support

### Validation System
- Comprehensive node validation
- Constraint checking (heading levels, empty containers, etc.)
- Action validation before execution

### Enhanced Rendering
- Layout-driven component mapping
- Unified Block component handles all node types
- Address badges for development/debugging

## Usage Examples

### Creating Nodes
```typescript
// Heading
{
  action: 'appendChild',
  parent: '1',
  node: {
    title: 'EXPERIENCE',
    layout: 'heading',
    style: { level: 1, weight: 'bold' }
  }
}

// List item
{
  action: 'appendChild', 
  parent: '2.1',
  node: {
    text: 'Reduced latency by 45% through caching optimization',
    layout: 'list-item',
    style: { listMarker: 'bullet' }
  }
}

// Key-value pair
{
  action: 'appendChild',
  parent: '1', 
  node: {
    title: 'Email',
    text: 'john@example.com',
    layout: 'key-value'
  }
}
```

### Updating Content
```typescript
// Update text
{
  action: 'replaceText',
  id: '2.1.1',
  text: 'Reduced p95 latency by 47% using Redis caching (420ms→220ms)'
}

// Update styling
{
  action: 'update',
  id: '2',
  patch: {
    style: { level: 1, weight: 'bold', color: '#1a1a1a' }
  }
}
```

## Benefits

1. **Simplified Architecture**: Single node type eliminates complexity
2. **Flexible Presentation**: Layout and style properties control rendering
3. **Better AI Integration**: Numbered addressing enables precise references
4. **Enhanced Validation**: Comprehensive constraint checking
5. **Future-Proof**: Extensible design supports new features
6. **Backward Compatible**: Smooth transition from legacy system

## Files Changed

### Core Types
- `src/types.ts` - Unified type definitions
- `src/utils/numbering.ts` - Address computation and AI serialization
- `src/utils/validation.ts` - Validation system
- `src/utils/migration.ts` - Legacy compatibility

### Services
- `src/services/actionHandler.ts` - Unified action processing
- `src/services/geminiService.ts` - AI integration updates
- `src/services/systemPrompts.ts` - Updated prompts
- `src/services/chatController.ts` - Action description updates

### Components
- `src/components/Resume/UnifiedBlock.tsx` - New unified renderer
- `src/components/Resume/TreeResumeRenderer.tsx` - Updated to use UnifiedBlock

### State Management
- `src/store/useAppStore.ts` - Updated for unified actions
- `src/services/prompts.ts` - Updated serialization

## Testing

The system includes comprehensive validation and maintains backward compatibility. All existing functionality is preserved while providing enhanced capabilities for future development.

## Next Steps

1. Monitor system performance with real usage
2. Gather feedback on new addressing system
3. Consider additional layout types as needed
4. Optimize rendering performance for large resumes
5. Add more sophisticated validation rules as patterns emerge