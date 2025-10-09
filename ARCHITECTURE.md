# Resume Agent - Project Architecture & Workflow

## Overview

Resume Agent is an AI-powered resume optimization tool built with React, TypeScript, and Vite. It uses Google's Gemini AI to analyze PDF resumes, provide intelligent suggestions, and generate beautifully designed resume layouts.

## Tech Stack

### Frontend Framework
- **React 19.1.1** with TypeScript
- **Vite 7.1.2** for build tooling and development server
- **Tailwind CSS 4.1.12** for styling
- **Zustand 5.0.7** for state management with Immer for immutability

### AI & Processing
- **Google Generative AI (@google/generative-ai)** - Gemini 2.5 Flash model
- **PDF.js (pdfjs-dist)** - PDF text extraction
- **Zod** - Schema validation

### PDF Generation & Export
- **jsPDF** - PDF generation
- **html2canvas** - HTML to canvas conversion for PDF export

### Development Tools
- **ESLint** with TypeScript support
- **Prettier** for code formatting
- **Vitest** for testing with jsdom environment
- **PostCSS** with Autoprefixer

## Project Structure

```
src/
├── components/           # React components organized by feature
│   ├── Chat/            # Chat interface components
│   ├── Controls/        # UI controls and buttons
│   ├── Layout/          # Layout components (Header, MainLayout)
│   ├── Resume/          # Resume display and editing components
│   ├── Upload/          # File upload components
│   └── Welcome/         # Welcome screen and onboarding
├── config/              # Configuration files
│   └── designTemplates.ts  # Resume design templates
├── services/            # Business logic and external services
│   ├── actionHandler.ts     # Handles resume tree modifications
│   ├── chatController.ts    # Chat message processing
│   ├── designAgent.ts       # AI-powered design generation
│   ├── geminiService.ts     # Gemini AI integration
│   ├── simplePdfProcessor.ts # PDF text extraction
│   └── systemPrompts.ts     # AI prompts and instructions
├── store/               # State management
│   └── useAppStore.ts   # Main Zustand store
├── types/               # TypeScript type definitions
│   ├── design.ts        # Design-related types
│   └── types.ts         # Core application types
├── utils/               # Utility functions
│   ├── addressMap.ts    # Address-based node lookup
│   ├── languageDetection.ts # Text direction and language detection
│   ├── numbering.ts     # Tree node addressing system
│   ├── resumeSerializer.ts  # Resume context generation
│   ├── treeUtils.ts     # Tree manipulation utilities
│   └── validation.ts    # Resume tree validation
└── test/                # Test configuration
    └── setup.ts         # Vitest setup
```

## Core Architecture Concepts

### 1. Unified Node System

The application uses a single `ResumeNode` type for all resume content, replacing traditional section/item/bullet hierarchies:

```typescript
export type ResumeNode = {
  uid: string;                 // Stable unique identifier
  addr?: string;               // Computed address (e.g., "2.1.3")
  title?: string;              // Short title/heading
  text?: string;               // Rich/plain text content
  layout?: LayoutKind;         // How to render this block
  style?: StyleHints;          // Typography & spacing hints
  meta?: Record<string, any>;  // Metadata (dates, company, etc.)
  children?: ResumeNode[];     // Recursive tree structure
};
```

### 2. Address-Based System

Each node gets a hierarchical address (1, 1.1, 1.1.2) for:
- Precise AI targeting of specific content
- Undo/redo functionality
- Fast lookups via AddressMap
- Stable references across tree modifications

### 3. Generic Action System

All resume modifications use a unified action system:

```typescript
export type AgentAction =
  | AppendChildAction    // Add new content
  | InsertSiblingAction  // Insert after existing node
  | ReplaceTextAction    // Update text content
  | UpdateAction         // Modify node properties
  | MoveAction          // Relocate nodes
  | RemoveAction        // Delete content
  | ReorderAction;      // Change order
```

## Application Workflow

### Phase 1: Welcome & Upload
1. **WelcomeForm** component handles PDF upload and job description input
2. File validation ensures PDF format
3. Optional job description for AI tailoring

### Phase 2: Processing
1. **PDF Extraction**: SimplePDFProcessor extracts raw text using PDF.js
2. **AI Structuring**: GeminiService converts text to hierarchical ResumeNode tree
3. **Design Generation**: DesignAgent selects appropriate template and generates HTML/CSS
4. **Language Detection**: Determines text direction (LTR/RTL) and language

### Phase 3: Active Editing (New Improved System)
1. **MainLayout** displays split view: Resume preview + Tabbed interface
2. **Editing Tab**: Queue-based editing system with batch processing
   - Users add multiple editing instructions
   - Instructions can be prioritized (low/medium/high)
   - "Apply Changes" button processes all instructions via specialized EditingAgent
   - Batch processing for more consistent and optimized results
3. **Chat Tab**: Conversational interface for questions and advice
   - General resume feedback and career advice
   - No direct editing actions - purely conversational
4. **Real-time Updates**: Batch actions modify tree and regenerate design
5. **History Management**: Undo/redo with full state snapshots

## State Management (Zustand Store)

### Core State
```typescript
interface AppState {
  // Phase management
  phase: 'welcome' | 'processing' | 'active' | 'error';
  
  // Core data
  resumeTree: ResumeNode[];
  resumeTitle: string;
  numbering: Numbering;        // Address mappings
  jobDescription: string;
  
  // Design
  resumeDesign: GeneratedResumeDesign | null;
  
  // Chat & History
  messages: ChatMessage[];
  history: HistoryEntry[];
  historyIndex: number;
  
  // Fast lookups
  addressMap: AddressMap | null;
}
```

### Key Actions
- `initializeFromPDF()` - Complete PDF processing pipeline
- `applyAction()` - Apply AI-generated modifications
- `undo()/redo()` - History navigation
- `regenerateDesign()` - Update visual design after changes

## AI Integration

### Dual AI Architecture
The system now uses two specialized AI agents:

#### 1. GeminiService (General Purpose)
- **Model**: Gemini 2.5 Flash for balance of speed and quality
- **Use Cases**: Resume structuring, conversational chat, general advice
- **Context Management**: Maintains conversation history
- **Prompt Engineering**: Specialized prompts for different tasks

#### 2. EditingAgent (Specialized for Batch Editing)
- **Model**: Gemini 2.5 Flash with lower temperature (0.3) for consistency
- **Use Cases**: Batch processing of editing instructions
- **Optimization**: Processes multiple instructions efficiently
- **Validation**: Built-in action validation before applying changes

### AI Capabilities
1. **Resume Structuring**: Converts raw PDF text to hierarchical tree
2. **Batch Content Optimization**: Processes multiple editing instructions simultaneously
3. **Design Generation**: Creates complete HTML/CSS layouts
4. **Conversational Chat**: Provides advice and answers questions
5. **Instruction Prioritization**: Handles high/medium/low priority edits

### Prompt System
- `RESUME_STRUCTURING_PROMPT` - Converts text to tree structure
- `EDITING_AGENT_SYSTEM_PROMPT` - Specialized batch editing prompt
- `RESUME_AGENT_SYSTEM_PROMPT` - Conversational chat interaction
- `JOB_TAILORING_SYSTEM_ADDITION` - Job-specific optimizations

## Design System

### Template Architecture
Five built-in templates with different styles:
- **Modern Minimal** - Clean, tech-focused
- **Professional Classic** - Conservative, corporate
- **Creative Bold** - Eye-catching, design roles
- **Technical** - Code-inspired, developer-focused
- **Executive** - Sophisticated, leadership roles

### Template Selection
Automatic selection based on:
- Resume content analysis
- Job description keywords
- Role type detection

### Design Generation Process
1. **Content Analysis**: Extract resume structure and metadata
2. **Template Selection**: Choose appropriate design template
3. **HTML/CSS Generation**: AI creates complete, self-contained HTML
4. **Responsive Design**: Optimized for both screen and print

## Key Features

### 1. PDF Processing Pipeline
- Text extraction with PDF.js
- AI-powered structure detection
- Preservation of visual hierarchy
- Multi-language support

### 2. Advanced Editing System
- **Queue-Based Editing**: Add multiple instructions before applying
- **Priority System**: High/medium/low priority for instruction processing
- **Batch Processing**: Specialized EditingAgent processes multiple changes efficiently
- **Validation**: Built-in validation prevents invalid actions
- **Conversational Chat**: Separate tab for questions and general advice
- **Action History**: Undo/redo with full state snapshots

### 3. Design System
- Multiple professional templates
- Automatic template selection
- AI-generated HTML/CSS
- Print-optimized layouts

### 4. Export Capabilities
- PDF generation with jsPDF
- HTML export for web use
- Print-friendly formatting

## Development Workflow

### Build System
```bash
npm run dev      # Development server with HMR
npm run build    # Production build (TypeScript + Vite)
npm run preview  # Preview production build
npm run test     # Run Vitest tests
npm run lint     # ESLint checking
```

### Environment Configuration
```bash
VITE_GEMINI_API_KEY=your_api_key_here  # Required for AI features
```

### Code Quality
- **TypeScript** for type safety
- **ESLint** with React and TypeScript rules
- **Prettier** for consistent formatting
- **Vitest** for unit testing

## Performance Optimizations

### Build Optimizations
- **Code Splitting**: Vendor and PDF libraries separated
- **Tree Shaking**: Unused code elimination
- **Source Maps**: Disabled in production for smaller bundles

### Runtime Optimizations
- **Zustand + Immer**: Efficient state updates
- **AddressMap**: O(1) node lookups
- **Lazy Loading**: Services loaded on demand
- **Memoization**: React component optimization

## Security Considerations

### API Key Management
- Environment variables for sensitive keys
- Client-side API calls (user provides own key)
- No server-side storage of user data

### Data Privacy
- All processing happens client-side
- No resume data sent to external servers (except AI APIs)
- Temporary file processing only

## New Editing System Architecture

### EditInstruction Type System
```typescript
export type EditInstruction = {
  id: string;
  content: string;           // User's instruction text
  timestamp: number;
  status: 'pending' | 'applied' | 'failed';
  targetSection?: string;    // Optional section targeting
  priority?: 'low' | 'medium' | 'high';
};
```

### EditingAgent Workflow
1. **Instruction Collection**: Users add multiple editing instructions
2. **Prioritization**: Instructions sorted by priority (high → medium → low)
3. **Batch Processing**: EditingAgent processes up to 10 instructions simultaneously
4. **Action Generation**: AI generates specific AgentActions for each instruction
5. **Validation**: Actions validated against current resume structure
6. **Application**: Valid actions applied sequentially with error handling
7. **Design Regeneration**: Visual design updated to reflect all changes

### Benefits of New System
- **Better Consistency**: Batch processing reduces conflicting changes
- **User Control**: Users can review and prioritize before applying
- **Efficiency**: Single AI call processes multiple instructions
- **Reliability**: Built-in validation prevents invalid operations
- **Separation of Concerns**: Editing vs. conversational chat clearly separated

## Future Architecture Considerations

### Scalability
- Modular service architecture allows easy AI provider switching
- Plugin system for custom design templates
- Extensible action system for new editing capabilities
- EditingAgent can be extended with custom instruction types

### Extensibility
- Type-safe action system for new features
- Template system for custom designs
- Configurable AI prompts and models
- EditInstruction system supports custom metadata and targeting

## Error Handling

### Graceful Degradation
- Fallback templates if AI generation fails
- Error boundaries for component crashes
- Retry mechanisms for API failures

### User Feedback
- Processing stages with progress indicators
- Clear error messages with recovery options
- Validation feedback for user inputs

This architecture provides a solid foundation for an AI-powered resume optimization tool with room for future enhancements and scaling.