# ResumeLab - AI-Powered Resume Builder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646cff)](https://vitejs.dev/)

An intelligent resume builder powered by Google Gemini AI that helps you create, optimize, and design professional resumes. Upload your existing resume or start from scratch, then let AI help you tailor it for specific jobs and generate beautiful, print-ready designs.

## Features

### Intelligent Resume Processing
- **PDF Parser** - Upload existing resumes and automatically extract structured content
- **AI-Powered Structure** - Converts unstructured text into organized sections using Gemini AI
- **Multi-Language Support** - Automatic language detection with RTL support for Hebrew/Arabic
- **100% Data Capture** - No summarization, every detail from your resume is preserved

### Smart Content Editing
- **Tree-Based Editor** - Hierarchical content structure with drag-and-drop reordering
- **Inline Editing** - Click to edit any text directly in the interface
- **AI Chat Assistant** - Get writing suggestions and content improvements
- **Undo/Redo History** - Full history tracking with up to 50 undo levels

### Job-Specific Tailoring
- **Keyword Optimization** - Automatically bold relevant keywords matching job descriptions
- **Smart Reordering** - Sections and items reordered by relevance to target job
- **Impact Enhancement** - AI rewrites content for clarity without fabricating information
- **Original Preservation** - Keep both original and tailored versions

### Professional Design
- **5 Layout Templates**:
  - Classic Professional (single column)
  - Modern Sidebar Left (35% sidebar)
  - Modern Sidebar Right (30% sidebar)
  - Bold Header (large header + grid)
  - Modern Split (mixed arrangement)

- **Multiple Color Schemes** - Professionally designed color palettes
- **Print-Ready Output** - Multi-page support with exact preview matching
- **ATS-Friendly** - Semantic HTML that works with applicant tracking systems

## Technology Stack

### Frontend
- **React 19.1** with TypeScript
- **Vite 7.1** - Fast build tool and dev server
- **Tailwind CSS 4.1** - Utility-first styling
- **Zustand 5.0** - Lightweight state management with Immer

### AI/ML
- **Google Gemini AI** - Primary AI provider
  - `gemini-2.5-flash` - Fast processing for parsing and tailoring
  - `gemini-2.5-pro` - High-quality design generation
- **OpenAI SDK** - Available as alternative (optional)

### PDF Processing
- **PDF.js** - PDF parsing and text extraction
- **jsPDF** - PDF generation for export
- **html2canvas** - HTML to canvas conversion

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing framework
- **TypeScript 5.8** - Strong typing throughout

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Gemini API key ([Get one here](https://ai.google.dev/))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/resume_agent.git
cd resume_agent
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here  # Optional
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

## Usage Workflow

### 1. Welcome Phase
Start by choosing one of two options:
- **Upload PDF** - Parse an existing resume
- **Start from Scratch** - Create a new resume with a blank template

### 2. Processing Phase (if uploading PDF)
The app will:
- Extract text from your PDF
- Use AI to structure content into organized sections
- Detect language and text direction automatically

### 3. Editing Phase
Manually refine your resume:
- Edit text inline by clicking any content
- Drag and drop to reorder sections and items
- Add or remove sections as needed
- Chat with AI assistant for writing suggestions
- **Optional**: Enter a job description to tailor your resume

### 4. Layout Selection
Choose from 5 professional layout structures that best fit your style and industry.

### 5. Color Selection
Pick a color scheme from multiple professionally designed palettes.

### 6. Design Generation
AI generates beautiful HTML/CSS combining:
- Your chosen layout structure
- Your selected color scheme
- Your resume content
- Proper typography and spacing

### 7. Preview & Export
- View your final resume in live preview
- Export to PDF via print dialog
- Return to editing if needed
- Regenerate design with different options

## Project Structure

```
src/
├── ai/                          # AI agent system
│   ├── agents/                  # Specialized AI agents
│   │   ├── CVProcessingAgent.ts # PDF parsing & structuring
│   │   ├── TailoringAgent.ts    # Job-specific optimization
│   │   └── DesignAgent.ts       # HTML/CSS generation
│   ├── clients/                 # AI service clients
│   │   └── GeminiClient.ts      # Google Gemini API wrapper
│   ├── prompts/                 # Centralized prompt templates
│   └── types/                   # AI-related TypeScript types
│
├── components/                  # React components
│   ├── editing/                 # Content editing components
│   ├── feedback/                # Loading & error screens
│   ├── forms/                   # Input forms
│   ├── layout/                  # App layout components
│   ├── phases/                  # Phase-specific screens
│   └── ui/                      # Reusable UI components
│
├── phaseUtils/                  # Phase-specific utilities
│   ├── design/                  # Design system & templates
│   │   ├── templates/           # 5 layouts, color schemes
│   │   └── types/               # Design types
│   └── editing/                 # Editing utilities & hooks
│
├── store/                       # Zustand state management
│   └── slices/                  # State slices
│       ├── resumeSlice.ts       # Resume data & operations
│       ├── editingSlice.ts      # Editing state
│       ├── chatSlice.ts         # AI chat assistance
│       └── uiSlice.ts           # UI state
│
├── types/                       # TypeScript definitions
│   ├── app.types.ts             # App-wide types
│   ├── resume.types.ts          # Resume tree structure
│   └── pdf.types.ts             # PDF processing types
│
└── utils/                       # Utility functions
    ├── tree/                    # Tree manipulation utilities
    ├── validation/              # Validation functions
    └── action-handler.ts        # Agent action processor
```

## Core Concepts

### Resume Tree Structure

Resumes are represented as a hierarchical tree of nodes:

```typescript
type ResumeNode = {
  title?: string;              // Heading text
  text?: string;               // Body content
  layout?: LayoutKind;         // Visual rendering type
  style?: StyleHints;          // Typography hints
  meta?: Record<string, any>;  // Metadata (dates, company, etc.)
  children?: ResumeNode[];     // Nested nodes
  uid?: string;                // Unique identifier (auto-generated)
  addr?: string;               // Tree address (e.g., "2.1.3")
};
```

### Layout Types
- `heading` - Section headers
- `paragraph` - Text blocks
- `list-item` - Bullet points
- `key-value` - Label: value pairs
- `grid` - Multi-column container
- `container` - Generic grouping

### AI Agents

#### CVProcessingAgent
Parses PDF files and extracts structured data:
1. Extracts text using PDF.js
2. Sends to Gemini AI for structuring
3. Detects language and text direction
4. Returns organized `ResumeNode[]` tree

#### TailoringAgent
Optimizes resumes for specific job descriptions:
- Reorders sections by relevance
- Bolds keywords matching job requirements
- Rewrites content for impact
- **Never fabricates** - only enhances existing information

#### DesignAgent
Generates professional HTML/CSS:
- Uses `gemini-2.5-pro` for highest quality
- Includes 100% of content (no omissions)
- Matches exact colors from selected scheme
- Creates print-friendly, multi-page layouts
- Supports RTL for Hebrew/Arabic

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run test     # Run tests with Vitest
npm run lint     # Lint code with ESLint
```

### Testing

The project uses Vitest with React Testing Library:

```bash
npm run test
```

### Build Configuration

- **Bundler**: Vite 7.1
- **Output**: `dist/` directory
- **Code Splitting**: Vendor (React) and PDF libraries in separate chunks
- **Source Maps**: Disabled in production for smaller bundle size

## Deployment

The project is configured for Vercel deployment (see `vercel.json`):

```bash
npm run build
```

Then deploy the `dist/` directory to your hosting platform.

Make sure to set environment variables:
- `VITE_GEMINI_API_KEY`
- `VITE_OPENAI_API_KEY` (optional)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. Follow TypeScript best practices
2. Use existing component patterns
3. Add tests for new features
4. Run linter before committing
5. Keep prompts centralized in `PromptTemplates.ts`

## License

MIT License - Copyright (c) 2025 Guy Yagil

See [LICENSE](LICENSE) file for details.

## Acknowledgments

- Powered by [Google Gemini AI](https://ai.google.dev/)
- Built with [React](https://reactjs.org/) and [Vite](https://vitejs.dev/)
- PDF processing by [PDF.js](https://mozilla.github.io/pdf.js/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review code examples in the repository

---

**Made with AI-powered intelligence for modern job seekers**
