# Requirements Document

## Introduction

The Resume Agent system needs to be rewritten to use a unified node structure that replaces multiple node subtypes (section/item/bullet/text) with a single, flexible node type. This unified approach will build hierarchical, block-based resumes where presentation is driven by layout and style properties rather than node types. The system must maintain AI-friendly addressing for chat interactions while supporting PDF intake that infers layout from visual cues.

## Requirements

### Requirement 1

**User Story:** As a developer, I want a unified data model for resume nodes, so that I can eliminate complexity from multiple node types and simplify the codebase.

#### Acceptance Criteria

1. WHEN the system processes resume data THEN it SHALL use a single `ResumeNode` type for all content blocks
2. WHEN a node is created THEN it SHALL have a unique identifier (`uid`) and optional computed address (`addr`)
3. WHEN content is stored THEN nodes SHALL support optional `title` and `text` fields for flexible content representation
4. WHEN presentation is defined THEN nodes SHALL use `layout` and `style` properties instead of node type to determine rendering
5. WHEN metadata is needed THEN nodes SHALL support a flexible `meta` record for AI and export functionality
6. WHEN hierarchical structure is required THEN nodes SHALL support recursive `children` arrays

### Requirement 2

**User Story:** As a system, I want consistent addressing and numbering for all nodes, so that AI agents can reliably reference specific resume sections.

#### Acceptance Criteria

1. WHEN addresses are computed THEN they SHALL follow depth-based index paths starting at 1
2. WHEN nodes are at the first depth THEN they SHALL be addressed as `1`, `2`, `3`, etc.
3. WHEN nodes are nested THEN they SHALL append ".<innerIndex>" to parent address (e.g., `1.1`, `1.1.1`)
4. WHEN addresses are displayed in AI prompts THEN top-level nodes SHALL show `.0` suffix for clarity (e.g., `1.0`, `2.0`)
5. WHEN addresses are stored in runtime THEN they SHALL NOT include the `.0` suffix
6. WHEN the tree structure changes THEN addresses SHALL be recomputed to maintain consistency

### Requirement 3

**User Story:** As an AI agent, I want a numbered outline of the resume in my system prompt, so that I can easily reference and modify specific sections.

#### Acceptance Criteria

1. WHEN generating AI context THEN the system SHALL serialize the resume tree into a numbered outline
2. WHEN displaying to AI THEN top-level sections SHALL show `.0` suffix (e.g., `1.0 Title`, `2.0 Experience`)
3. WHEN showing nested content THEN indentation SHALL reflect the hierarchy depth
4. WHEN nodes have titles THEN the title SHALL be used as the label
5. WHEN nodes lack titles THEN the first line of text SHALL be used as preview
6. WHEN nodes are empty THEN they SHALL be labeled as "(untitled)"

### Requirement 4

**User Story:** As a system, I want generic CRUD operations for all node types, so that I can eliminate type-specific action handlers.

#### Acceptance Criteria

1. WHEN creating nodes THEN the system SHALL support `appendChild` action with parent address
2. WHEN inserting content THEN the system SHALL support `insertSibling` action with position reference
3. WHEN updating text THEN the system SHALL support `replaceText` action for content changes
4. WHEN modifying properties THEN the system SHALL support `update` action for layout, style, and metadata
5. WHEN reorganizing content THEN the system SHALL support `move` and `reorder` actions
6. WHEN removing content THEN the system SHALL support `remove` action by node ID
7. WHEN actions are processed THEN addresses SHALL be recomputed automatically

### Requirement 5

**User Story:** As a user uploading a PDF, I want the system to automatically infer layout and styling from visual cues, so that my resume structure is preserved without manual formatting.

#### Acceptance Criteria

1. WHEN processing PDF text THEN the system SHALL detect headings by font size, weight, and spacing
2. WHEN encountering bullet points THEN the system SHALL create list-item nodes with appropriate markers
3. WHEN finding paragraphs THEN the system SHALL create paragraph layout nodes for multi-line text blocks
4. WHEN detecting key-value pairs THEN the system SHALL create key-value layout nodes (e.g., "Email:", "Phone:")
5. WHEN identifying multi-column content THEN the system SHALL create grid or container layouts
6. WHEN extracting metadata THEN the system SHALL populate the meta field with dates, locations, and other structured data

### Requirement 6

**User Story:** As a user viewing my resume, I want consistent rendering based on layout properties, so that my content appears correctly formatted regardless of the underlying data structure.

#### Acceptance Criteria

1. WHEN rendering heading layouts THEN the system SHALL display them as headings with appropriate level styling
2. WHEN rendering paragraph layouts THEN the system SHALL display them as text blocks
3. WHEN rendering list-item layouts THEN the system SHALL display them with the specified marker type
4. WHEN rendering key-value layouts THEN the system SHALL display them as label-value pairs
5. WHEN rendering grid layouts THEN the system SHALL arrange children in columns
6. WHEN rendering container layouts THEN the system SHALL group children without inherent visual styling
7. WHEN displaying addresses THEN they SHALL appear in hover UI using runtime format (without `.0`)

### Requirement 7

**User Story:** As a developer maintaining the system, I want a clear migration path from the old node system, so that existing data and functionality continue to work during the transition.

#### Acceptance Criteria

1. WHEN migrating old actions THEN the system SHALL provide adapter functions for backward compatibility
2. WHEN converting old section nodes THEN they SHALL become heading layout nodes
3. WHEN converting old item nodes THEN they SHALL become container or paragraph layout nodes
4. WHEN converting old bullet nodes THEN they SHALL become list-item layout nodes
5. WHEN migrating trees THEN the system SHALL preserve all content and hierarchy
6. WHEN testing migration THEN existing PDFs SHALL produce equivalent visual output

### Requirement 8

**User Story:** As a system administrator, I want validation and constraints on the unified node structure, so that data integrity is maintained throughout the application.

#### Acceptance Criteria

1. WHEN nodes are created THEN the system SHALL enforce unique `uid` values
2. WHEN layout is specified THEN it SHALL be a valid `LayoutKind` value
3. WHEN tree mutations occur THEN addresses SHALL be automatically recomputed
4. WHEN validating structure THEN headings at depth 0 SHALL typically use style level ≤ 2
5. WHEN checking consistency THEN empty container nodes SHALL be flagged for review
6. WHEN linting content THEN list-items with multi-paragraph text SHALL be flagged as potential issues