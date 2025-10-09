# Project Reorganization Plan

## New Folder Structure

```
src/
├── app/                          # Application entry and routing
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── features/                     # Feature-based organization
│   ├── welcome/                  # Welcome and onboarding
│   │   ├── components/
│   │   │   ├── WelcomeScreen.tsx
│   │   │   └── FileUploadForm.tsx
│   │   └── hooks/
│   │       └── useFileUpload.ts
│   ├── resume/                   # Resume display and rendering
│   │   ├── components/
│   │   │   ├── ResumePreview.tsx
│   │   │   ├── HTMLRenderer.tsx
│   │   │   └── TreeRenderer.tsx
│   │   ├── hooks/
│   │   │   └── useResumeExport.ts
│   │   └── utils/
│   │       └── renderingHelpers.ts
│   ├── editing/                  # Editing system
│   │   ├── components/
│   │   │   ├── EditingPanel.tsx
│   │   │   ├── InstructionCard.tsx
│   │   │   ├── InstructionQueue.tsx
│   │   │   └── BatchApplyButton.tsx
│   │   ├── services/
│   │   │   └── EditingAgent.ts
│   │   ├── hooks/
│   │   │   └── useEditingQueue.ts
│   │   └── types/
│   │       └── editing.types.ts
│   ├── chat/                     # Conversational chat
│   │   ├── components/
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── Message.tsx
│   │   ├── services/
│   │   │   └── ChatService.ts
│   │   └── hooks/
│   │       └── useChat.ts
│   └── design/                   # Design templates and generation
│       ├── components/
│       │   └── DesignSelector.tsx
│       ├── services/
│       │   └── DesignAgent.ts
│       ├── templates/
│       │   ├── index.ts
│       │   ├── modern.template.ts
│       │   ├── professional.template.ts
│       │   └── creative.template.ts
│       └── types/
│           └── design.types.ts
├── shared/                       # Shared utilities and components
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Basic UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Tabs.tsx
│   │   ├── layout/               # Layout components
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── feedback/             # Feedback components
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── StatusIndicator.tsx
│   ├── services/                 # Core services
│   │   ├── ai/                   # AI-related services
│   │   │   ├── GeminiClient.ts
│   │   │   └── PromptTemplates.ts
│   │   ├── pdf/                  # PDF processing
│   │   │   └── PDFProcessor.ts
│   │   └── storage/              # Data persistence
│   │       └── LocalStorage.ts
│   ├── hooks/                    # Shared hooks
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   └── useAsync.ts
│   ├── utils/                    # Utility functions
│   │   ├── tree/                 # Tree manipulation
│   │   │   ├── treeUtils.ts
│   │   │   ├── addressMap.ts
│   │   │   └── numbering.ts
│   │   ├── validation/           # Validation utilities
│   │   │   └── resumeValidator.ts
│   │   ├── formatting/           # Text and data formatting
│   │   │   ├── textUtils.ts
│   │   │   └── dateUtils.ts
│   │   └── export/               # Export utilities
│   │       ├── pdfExport.ts
│   │       └── htmlExport.ts
│   ├── types/                    # Shared type definitions
│   │   ├── core.types.ts         # Core resume types
│   │   ├── api.types.ts          # API response types
│   │   └── common.types.ts       # Common utility types
│   └── constants/                # Application constants
│       ├── config.ts
│       └── routes.ts
├── store/                        # State management
│   ├── index.ts                  # Store configuration
│   ├── slices/                   # Feature slices
│   │   ├── resumeSlice.ts
│   │   ├── editingSlice.ts
│   │   ├── chatSlice.ts
│   │   └── uiSlice.ts
│   └── middleware/               # Store middleware
│       └── persistenceMiddleware.ts
└── assets/                       # Static assets
    ├── images/
    ├── icons/
    └── styles/
        ├── globals.css
        └── components.css
```

## Files to Delete (Obsolete)

1. `src/components/Chat/ChatInterface.tsx` - Replaced by new chat system
2. `src/components/Chat/ActionPreview.tsx` - Not used
3. `src/services/chatController.ts` - Replaced by new services
4. `src/services/prompts.ts` - Consolidated into PromptTemplates
5. `src/utils/migration.ts` - No longer needed
6. `src/utils/sampleData.ts` - Development only
7. `src/components/components - Shortcut.lnk` - Unnecessary file
8. `src/App.css` - Will be consolidated
9. `src/App.test.tsx` - Will be reorganized

## Migration Strategy

1. Create new folder structure
2. Move and rename files to new locations
3. Update all imports
4. Consolidate similar functionality
5. Remove obsolete files
6. Update build configuration