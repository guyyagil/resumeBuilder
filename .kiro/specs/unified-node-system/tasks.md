# Implementation Plan

- [x] 1. Update core type definitions for unified node system


  - Replace existing node types with unified `ResumeNode` structure
  - Define `LayoutKind` and `StyleHints` enums and interfaces
  - Update action types to use generic operations
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Implement unified numbering and addressing system


  - [x] 2.1 Create `computeNumbering` function with 1-based indexing

    - Implement depth-based address computation (1, 1.1, 1.1.1)
    - Generate bidirectional UID-to-address mappings
    - Handle tree mutations with automatic recomputation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 2.2 Implement AI prompt serialization with .0 suffix

    - Create `serializeForLLM` function for numbered outlines
    - Add .0 suffix for top-level nodes in AI context only
    - Include proper indentation and content previews
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ]* 2.3 Write unit tests for numbering system
    - Test address computation accuracy
    - Test tree mutation handling
    - Test AI serialization format
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 3. Create generic action handler system


  - [x] 3.1 Implement unified `ActionHandler` class


    - Replace type-specific handlers with generic operations
    - Support appendChild, insertSibling, replaceText, update, move, remove, reorder
    - Implement address-based node resolution
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - [x] 3.2 Create migration adapters for backward compatibility

    - Map old appendSection/appendItem/appendBullet to new actions
    - Provide translation layer for existing code
    - Ensure seamless transition during migration
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  - [ ]* 3.3 Write comprehensive action handler tests
    - Test each action type with various scenarios
    - Test error handling and edge cases
    - Test address resolution and tree integrity
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 4. Update PDF processing for layout and style inference


  - [x] 4.1 Enhance PDF text extraction with styling metadata


    - Extract font sizes, weights, and positioning data
    - Capture spatial relationships between text elements
    - Generate style analysis summaries for AI processing
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 4.2 Implement layout inference heuristics

    - Detect headings by font size and weight patterns
    - Identify lists by bullet markers and indentation
    - Recognize key-value pairs by colon patterns
    - Detect multi-column layouts by spatial clustering
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 4.3 Update AI integration for unified node creation


    - Modify Gemini service to output unified node structures
    - Include layout and style properties in AI responses
    - Handle metadata extraction during processing
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ]* 4.4 Create PDF processing integration tests
    - Test with various resume formats and layouts
    - Verify layout inference accuracy
    - Test style extraction and application
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 5. Implement unified rendering system


  - [x] 5.1 Create layout-to-component mapping system


    - Map each LayoutKind to appropriate React component
    - Handle style hints application in components
    - Support recursive rendering of nested structures
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  - [x] 5.2 Build generic Block component for unified rendering

    - Replace separate Section/Item/Bullet components
    - Support all layout types through single component
    - Apply styling based on style hints and depth
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  - [x] 5.3 Implement address display in hover UI

    - Show runtime addresses (without .0 suffix) on hover
    - Provide visual feedback for node selection
    - Support click-to-copy address functionality
    - _Requirements: 6.7_
  - [ ]* 5.4 Create rendering component tests
    - Test each layout type renders correctly
    - Test style application and inheritance
    - Test address display functionality
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 6. Update state management for unified system


  - [x] 6.1 Modify app store to use unified node types


    - Update state interfaces to use ResumeNode
    - Replace type-specific operations with generic actions
    - Maintain backward compatibility during transition
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 6.2 Integrate new action handler in store operations

    - Replace existing action processing with unified handler
    - Ensure proper error handling and rollback
    - Maintain history tracking for undo/redo
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - [x] 6.3 Update numbering computation in state mutations

    - Automatically recompute addresses after tree changes
    - Update AI prompt context when tree structure changes
    - Maintain performance with efficient recomputation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [ ]* 6.4 Write state management integration tests
    - Test action application and state updates
    - Test undo/redo functionality with new system
    - Test error handling and recovery
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 7. Implement validation and constraint system


  - [x] 7.1 Create node validation functions


    - Enforce unique UID requirements
    - Validate layout and style property values
    - Check tree structure integrity
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - [x] 7.2 Add runtime constraint checking

    - Validate heading levels at appropriate depths
    - Flag empty container nodes for review
    - Check for multi-paragraph list items
    - _Requirements: 8.4, 8.5, 8.6_
  - [x] 7.3 Implement validation error reporting

    - Provide clear error messages with node paths
    - Support warning vs error severity levels
    - Enable validation in development mode
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - [ ]* 7.4 Create validation system tests
    - Test all validation rules with edge cases
    - Test error reporting and recovery
    - Test performance with large trees
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 8. Create migration utilities and backward compatibility


  - [x] 8.1 Build legacy data migration functions


    - Convert old section nodes to heading layout
    - Transform item nodes to container/paragraph layout
    - Map bullet nodes to list-item layout
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  - [x] 8.2 Implement action adapter layer

    - Provide appendSection → appendChild translation
    - Map appendItem → appendChild with container layout
    - Convert appendBullet → appendChild with list-item layout
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  - [x] 8.3 Create migration validation and testing

    - Verify content preservation during migration
    - Test visual output equivalence
    - Ensure no data loss in conversion process
    - _Requirements: 7.5, 7.6, 7.7_
  - [ ]* 8.4 Write migration system tests
    - Test with real legacy data samples
    - Verify backward compatibility
    - Test migration performance
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 9. Update AI integration and prompt system


  - [x] 9.1 Modify system prompts for unified addressing


    - Include numbered outline in AI context
    - Update instruction format for address references
    - Clarify layout vs style property usage
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_


  - [ ] 9.2 Update chat controller for new action format
    - Parse AI responses into unified actions
    - Handle address resolution in chat context


    - Maintain conversation history with new format
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - [ ] 9.3 Enhance AI response validation
    - Validate generated actions before application
    - Provide helpful error messages for invalid addresses
    - Support graceful fallback for malformed responses
    - _Requirements: 8.1, 8.2, 8.3_
  - [-]* 9.4 Create AI integration tests



    - Test prompt generation with various tree structures
    - Test action parsing and validation
    - Test error handling with malformed AI responses

    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 10. Final integration and cleanup


  - [x] 10.1 Remove legacy code and components


    - Delete old node type definitions
    - Remove type-specific action handlers
    - Clean up unused component files
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ] 10.2 Update documentation and examples
    - Document new unified node structure
    - Provide migration guide for developers
    - Update API documentation
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  - [x] 10.3 Performance optimization and final testing

    - Optimize tree operations for large resumes
    - Test memory usage with complex structures
    - Verify rendering performance
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ]* 10.4 Comprehensive end-to-end testing
    - Test complete user workflows
    - Verify cross-browser compatibility
    - Test with various PDF formats
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_