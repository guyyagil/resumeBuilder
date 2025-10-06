# Clean PDF Processing Flow

## Overview
Simple, straightforward PDF to Resume Tree conversion with clear responsibilities.

## The Flow

```
PDF File → Extract Text → AI Generates Actions → Build Tree → Done
```

## Single Entry Point

**`PDFProcessor`** (`src/services/pdfProcessor.ts`)

This is the ONLY class you need to interact with for PDF processing.

```typescript
const processor = new PDFProcessor(apiKey);
const tree = await processor.processResume(pdfFile);
```

## What It Does

### Step 1: Extract Text from PDF
- Uses pdf.js to extract raw text
- Combines all pages into single string
- No complex parsing or formatting

### Step 2: AI Generates Actions
- Sends text to Gemini AI
- AI returns array of actions (appendSection, appendItem, appendBullet)
- AI is responsible for understanding structure

### Step 3: Build Tree from Actions
- Processes actions sequentially
- Creates nodes with UIDs
- Validates parent-child relationships
- Skips invalid bullets instead of failing

### Step 4: Validate & Return
- Checks all nodes have required fields
- Returns complete tree structure

## Key Design Decisions

### 1. **Single Responsibility**
- PDFProcessor does ONE thing: PDF → Tree
- No mixing of concerns
- Clear error messages

### 2. **Fail Fast on Critical Errors**
- Missing sections → Error
- Missing items → Error
- Missing bullets → Warning (skip and continue)

### 3. **Simple Action Processing**
- No complex action handler classes
- Direct tree manipulation
- Easy to debug

### 4. **Clear Logging**
- Every step logged
- Easy to see where things go wrong
- Action-by-action progress

## Error Handling

### Hard Errors (Stop Processing)
- PDF can't be read
- Text too short (< 50 chars)
- AI returns no actions
- Section/Item missing required fields
- Parent doesn't exist when adding item

### Soft Errors (Log & Continue)
- Bullet parent not found (skip bullet)
- Unknown action type (skip action)

## Usage

```typescript
// In your component or store
import { PDFProcessor } from '../services/pdfProcessor';

const processor = new PDFProcessor(apiKey);

try {
  const tree = await processor.processResume(file);
  // tree is ready to use
} catch (error) {
  // Show error to user
  console.error('Failed to process resume:', error.message);
}
```

## What Was Removed

- ❌ ResumeBuilder class (redundant)
- ❌ PDFService class (redundant)
- ❌ pdfToTreeService (redundant)
- ❌ Complex action handler with multiple layers
- ❌ Confusing validation logic
- ❌ Multiple entry points

## What Remains

- ✅ PDFProcessor (single entry point)
- ✅ GeminiService (AI communication)
- ✅ ActionHandler (for chat updates only)
- ✅ Tree utilities (finding nodes, etc.)
- ✅ Numbering system (address computation)

## Benefits

1. **Easy to understand** - One file, clear flow
2. **Easy to debug** - Detailed logging at each step
3. **Easy to test** - Single class to test
4. **Easy to modify** - All logic in one place
5. **Resilient** - Skips bad bullets instead of failing completely

## The Old Way vs New Way

### Old Way (Messy)
```
PDF → PDFService → ResumeBuilder → ActionHandler → Tree
       ↓
   pdfToTreeService
       ↓
   GeminiService
```

### New Way (Clean)
```
PDF → PDFProcessor → Tree
         ↓
      GeminiService
```

Much simpler!
