# Dynamic Resume System Specification

## Overview
This system replaces the static resume structure (skills, experience, education) with a fully **dynamic, hierarchical tree model**.  
The resume is represented as a tree of `ResumeNode` objects, each with a stable `uid`, a computed numeric `addr`, and optional children.

The **AI workflow** is simplified:  
- The resume is serialized with visible numbered sections (`1.0`, `2.1`, `2.1.1`, …).  
- The AI issues JSON patches referencing these numbers.  
- The system maps numbers → nodes via a hash map (`addrToUid`) and applies updates.

---

## Data Model

### ResumeNode
```ts
type ResumeNode = {
  uid: string;              // Stable unique identifier
  addr?: string;            // Derived numeric address (e.g., "2.1.3")
  title: string;            // Section/Item/Bullet title
  content?: string;         // Free text content
  meta?: Record<string, any>; // Optional layout or metadata
  children?: ResumeNode[];  // Nested subsections/items/bullets
};
```

### Numbering Maps
```ts
type Numbering = {
  addrToUid: Record<string, string>; // Map number → uid
  uidToAddr: Record<string, string>; // Map uid → number
};
```

---

## Store (src/store/useAppStore.new.ts)

### State
- `tree: ResumeNode[]`
- `numbering: Numbering`

### Core Actions
- `rebuildNumbering()`: Walk tree, assign addresses, build maps.
- `updateNode(uid: string, newContent: string)`: Replace content of a node.
- `updateByAddr(addr: string, newContent: string)`: Resolve addr → uid, update node.
- `appendBullet(addrItem: string, text: string)`: Add a bullet under an item node.
- `appendItem(addrSection: string, title: string, content?: string)`: Add item under a section.
- `removeByAddr(addr: string)`: Remove node by numeric address.
- `getCompatResume()`: Convert `ResumeNode[]` back into old `Resume` shape for UI compatibility.

---

## Utilities

### resumeToTree(resume: Resume) → ResumeNode[]
Convert legacy `Resume` object (sections/items) into dynamic tree nodes.

### serializeForLLM(tree: ResumeNode[]) → string
Serialize resume into plain text with visible numbered addresses:
```
1.0 Professional Summary
1.1 Seasoned backend engineer...
2.0 Work Experience
2.1 Company A — Software Engineer
2.1.1 Developed REST APIs
```

---

## AI Protocol

### Input
- The **entire numbered resume** string.
- A user request in natural language.

### Output
- A single JSON patch object, e.g.:
```json
{ "id": "2.1.3", "action": "replace", "text": "Improved API latency by 45%" }
```

### Supported Actions
- `replace`: `{ "id": "x.y.z", "action": "replace", "text": "..." }`
- `appendBullet`: `{ "id": "x.y", "action": "appendBullet", "text": "..." }`
- `appendItem`: `{ "id": "x.0", "action": "appendItem", "title": "...", "text": "..." }`
- `remove`: `{ "id": "x.y", "action": "remove" }`

---

## Migration Plan

1. **Define** `ResumeNode` in `src/types.ts`.
2. **Implement** new store (`useAppStore.new.ts`) for dynamic tree.
3. **Add** `resumeToTree` to convert old resumes → new tree.
4. **Implement** `serializeForLLM` and new prompt system (`prompts.new.ts`).
5. **Implement** new AI update handler (`resumeUpdateHandler.new.ts`) that applies patches by addr.
6. **Add** `getCompatResume()` to maintain UI functionality without rewriting components.
7. **Gradually replace** old section-specific operations with generic tree ops.

---

## Acceptance Criteria
- Supports arbitrary sections/items/bullets (no schema edits needed).
- AI can update nodes using numeric addresses.
- UI continues working through compatibility layer.
- Numbering is deterministic and rebuilt after each change.
- Undo/redo supported by snapshotting tree state.
