# Dynamic Resume System Specification (As Implemented)

## Overview
This document describes the **current state** of the dynamic resume system, based on the implemented files in the codebase.  
The system replaces the static section-based resume model with a **tree-based structure** (`ResumeNode`) and introduces utilities for **tree conversion, numbering, serialization, and update handling**.

---

## Core Components

### 1. Data Structures
Defined in `types.ts` (extended implicitly by related files):

```ts
type ResumeNode = {
  uid: string;              // Stable unique identifier
  addr?: string;            // Numeric address (computed)
  title: string;            // Node title
  content?: string;         // Free text content
  meta?: Record<string, any>;
  children?: ResumeNode[];
};
```

- `addr` is computed dynamically (e.g., `1.0`, `2.1`, `2.1.1`) using `numbering.ts`.
- `uid` ensures stability across renumberings.

---

### 2. Store
Implemented in `useAppStore.ts`:
- Manages state for the resume, chat messages, job posting, and history.
- Includes `resume` object and `sections`.
- For dynamic features, it relies on tree utilities (`toTree.ts`, `fromTree.ts`, `numbering.ts`).

---

### 3. Tree Conversion Utilities
- `toTree.ts`: Converts legacy `Resume` (with sections/items) → `ResumeNode[]`.
- `fromTree.ts`: Converts back from `ResumeNode[]` → legacy `Resume` format for UI compatibility.

---

### 4. Numbering
Implemented in `numbering.ts`:
- Walks the `ResumeNode` tree and assigns deterministic numeric addresses.
- Maintains lookup maps:
```ts
type Numbering = {
  addrToUid: Record<string, string>;
  uidToAddr: Record<string, string>;
};
```
- Enables mapping between visible numbers and stable `uid`s.

---

### 5. Prompt Serialization
Implemented in `prompts.ts`:
- `serializeForLLM(tree: ResumeNode[])` generates a plain-text representation of the resume with numeric addresses:
```
1.0 Professional Summary
1.1 Backend engineer with 5+ years...
2.0 Work Experience
2.1 Acme Corp — Developer
2.1.1 Built APIs and microservices
```
- This string is passed to the AI as context.

---

### 6. Update Handler
Implemented in `resumeUpdateHandler.ts`:
- Accepts AI JSON patches:
```json
{ "id": "2.1.3", "action": "replace", "text": "Improved API latency by 45%" }
```
- Resolves `id` → `uid` using numbering maps.
- Applies updates via the store and rebuilds numbering.

---

### 7. Gemini Service
Implemented in `geminiService.ts`:
- Wraps communication with the LLM.
- Sends serialized resume string + system/user prompts.
- Expects minimal JSON patches back.

---

## AI Protocol

### Input to AI
- Full serialized resume string with numbered addresses.

### Output from AI
- A minimal JSON object describing the change:
```json
{ "id": "x.y.z", "action": "replace", "text": "..." }
```

### Supported Actions
- `replace`
- `appendBullet`
- `appendItem`
- `remove`

---

## Migration Status
✅ **Tree structure (`ResumeNode`)**  
✅ **Conversion utilities (`toTree`, `fromTree`)**  
✅ **Numbering system (`numbering.ts`)**  
✅ **Prompt serialization (`prompts.ts`)**  
✅ **Update handler (`resumeUpdateHandler.ts`)**  
✅ **Gemini service integration (`geminiService.ts`)**  
✅ **Store compatibility with old UI (`useAppStore.ts`)**  

---

## Next Steps
- Harden undo/redo logic for the dynamic tree.
- Expand test coverage for `numbering` and patch application.
- Gradually migrate UI to consume `ResumeNode` directly instead of legacy `Resume`.
