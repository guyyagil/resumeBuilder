# Resume Agent — Unified Node & Numbering Spec (v2)

> **Goal**: Replace multiple node subtypes (section/item/bullet/text) with **one unified node type** that builds a hierarchical, block‑based resume. Presentation (e.g., bullets vs. paragraphs) is driven by `layout` and `style` rather than the node type. The WelcomeForm PDF intake infers these from the uploaded PDF’s text + visual cues.

---

## 1) Unified Data Model

### 1.1 `ResumeNode`
```ts
// Single node type
export type ResumeNode = {
  uid: string;                 // stable unique id
  addr?: string;               // computed address (e.g., "2.1.3")

  // Content
  title?: string;              // short title/heading for the block (optional)
  text?: string;               // rich/plain text content (optional)

  // Presentation (purely visual/semantic hints)
  layout?: LayoutKind;         // how to render this block (list-item, paragraph, heading, etc.)
  style?: StyleHints;          // typography & spacing hints

  // Semantics / metadata (AI- and export-facing)
  meta?: Record<string, any>;  // e.g., dateRange, role, company, tags, etc.

  children?: ResumeNode[];     // recursive tree
};

export type LayoutKind =
  | 'heading'        // large label like section headers
  | 'paragraph'      // text block
  | 'list-item'      // one bullet/numbered line
  | 'key-value'      // label:value, for contacts or facts
  | 'grid'           // multi-column container (children define cells)
  | 'container';     // generic group (no inherent visual bullets)

export type StyleHints = {
  level?: number;              // e.g., heading level (1..4), or list nesting level
  listMarker?: 'bullet' | 'number' | 'dash' | 'none';
  indent?: number;             // px/em indentation hint
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  // extendable: color, spacingAbove, spacingBelow, etc.
};
```

**Notes**
- There is **no** special node type for *section/item/bullet* — all blocks are the same shape; bullets are just `layout:'list-item'` with `style.listMarker`.
- `title` is optional; blocks can be *text-only* (use `text`) or *label + details* (use both `title` and `text`).
- `meta` remains free-form so AI/exports can attach domain facts without changing layout logic.

---

## 2) Addressing & Numbering

### 2.1 Rules
- Address reflects **depth-based index path**: root indices start at 1.
- **First depth** (top-level) → `1`, `2`, `3`, ...
- **Deeper nodes** append ".<innerIndex>" to the parent address.
- We reserve the **`.0` convention exclusively for headings in system prompts** (see §5) and do **not** store `.0` in the runtime tree. Runtime addresses are strictly positional: `1`, `1.1`, `1.1.1`, …

**Examples**
```
Parent → 1
Child  → 1.1
Grandchild → 1.1.1
```

### 2.2 Computation
```ts
export function computeNumbering(tree: ResumeNode[]): Numbering {
  const addrToUid: Record<string,string> = {};
  const uidToAddr: Record<string,string> = {};

  function walk(nodes: ResumeNode[], prefix: number[] = []) {
    nodes.forEach((node, i) => {
      const addr = [...prefix, i + 1].join('.'); // 1-based at every level
      node.addr = addr;
      addrToUid[addr] = node.uid;
      uidToAddr[node.uid] = addr;
      if (node.children?.length) walk(node.children, [...prefix, i + 1]);
    });
  }

  walk(tree);
  return { addrToUid, uidToAddr };
}
```

---

## 3) AI‑Facing Numbered Context & Prompting

We want the **chat system prompt** to include a compact, numbered outline of the resume to make references trivial.

### 3.1 Outline Serialization for Prompts
```ts
export function serializeForLLM(tree: ResumeNode[]): string {
  const lines: string[] = [];
  function write(node: ResumeNode, depth: number) {
    const addr = node.addr ?? '';
    const pad = '  '.repeat(depth);

    // One-line header for each block
    const title = node.title?.trim();
    const textPreview = node.text?.trim()?.split('\n')[0];
    const label = title || textPreview || '(untitled)';

    // For top-level headings in prompts, add a trailing .0 to improve readability
    const printedAddr = depth === 0 ? `${addr}.0` : addr;

    lines.push(`${pad}${printedAddr} ${label}`);

    node.children?.forEach((c) => write(c, depth + 1));
  }
  tree.forEach((n) => write(n, 0));
  return lines.join('\n');
}
```

**Prompt snippet example** (what the model sees):
```
1.0 Title
2.0 Experience
  2.1 Job — Company
    2.1.1 Reduced latency 45% via caching
3.0 Skills
  3.1 Languages: Java, TS, SQL
```

> The `.0` suffix is **formatting-only** for top level when shown to the model for clarity and matches the user’s desired notation. Internally, the same nodes are addressed as `1`, `2`, `3`.

### 3.2 System Prompt Excerpt
- Include the serialized outline above at the end of the system prompt.
- Require the assistant to **reference nodes by address** (e.g., `2.1`, `2.1.1`).
- Make clear that block roles (bullet vs. paragraph) are set via `layout/style`, not node types.

---

## 4) Action Model (CRUD) — Generic Blocks

Replace type‑specific actions with **generic, address-based** operations:

```ts
export type AgentAction =
  | { action: 'appendChild'; parent: string; node: Partial<ResumeNode> }
  | { action: 'insertSibling'; after: string; node: Partial<ResumeNode> }
  | { action: 'replaceText'; id: string; text: string }
  | { action: 'update'; id: string; patch: Partial<ResumeNode> } // layout/style/meta/title/text
  | { action: 'move'; id: string; newParent: string; position?: number }
  | { action: 'remove'; id: string }
  | { action: 'reorder'; id: string; order: string[] };
```

**Guidelines**
- **appendChild**: create any block (heading, list-item, paragraph) under `parent`, configure via `layout/style`.
- **replaceText**: convenience for updating `text` only.
- **update**: patch `title`, `layout`, `style`, `meta`, etc.
- **insertSibling**: linear building from parsed PDFs where order is crucial.

---

## 5) PDF Intake (WelcomeForm) — Layout/Style Inference

### 5.1 Heuristics
- **Headings**: larger font size, bold, more spacing above/below → `layout:'heading'` with `style.level` (h1/h2/h3 via relative font bins).
- **Bullets/Lists**: leading glyphs (•, –, ·), left indents, consistent line leading → `layout:'list-item'`, `style.listMarker` by glyph.
- **Paragraphs**: multi-line blocks without bullet glyphs → `layout:'paragraph'`.
- **Key‑Value**: patterns like `Email:`, `Phone:` → `layout:'key-value'` with `title`=key, `text`=value.
- **Containers/Grids**: multi-column detection by distinct x‑bands → wrap contiguous blocks in `layout:'grid'` or `container`.

### 5.2 Output of Parser
- A tree of `ResumeNode` with `layout/style` filled.
- Minimal `meta` extraction (e.g., date ranges, locations) when patterns match.

---

## 6) Rendering Rules

- Map `layout`→component:
  - `heading` → <Heading level={style.level ?? 2}>
  - `paragraph` → <Paragraph>
  - `list-item` → <ListItem marker={style.listMarker ?? 'bullet'}>
  - `key-value` → <KeyValue>
  - `grid` → <Grid>
  - `container` → <Group>
- Indentation = function of address depth and/or `style.indent`.
- Numbering badges (hover UI) show `addr` (runtime form: `1`, `1.1`, `1.1.1`).

---

## 7) Store & Services Changes

### 7.1 Types & Numbering
- Replace old node unions with **unified `ResumeNode`**.
- Update `computeNumbering` to 1‑based per‑level indexing.
- Keep `Numbering` maps bidirectional.

### 7.2 ActionHandler
- Implement generic handlers for (§4) actions; drop `appendSection/appendItem/appendBullet` handlers.
- Normalize patches (deep‑merge `style` & `meta`).

### 7.3 Prompt Serialization
- Switch to `serializeForLLM` in §3.1 for system prompt.
- Top-level addresses printed as `X.0` in prompts **only**.

---

## 8) Migration Plan

1. **Adapter Layer**: Provide a translator from old actions → new actions:
   - `appendSection(title)` → `insertSibling` (after last top-level) with `layout:'heading'`, `title`.
   - `appendItem(id,title,...)` → `appendChild(parent=id, node:{title, layout:'container'|'paragraph', meta})`.
   - `appendBullet(id,text)` → `appendChild(parent=id, node:{text, layout:'list-item', style:{listMarker:'bullet'}})`.
2. **Tree Migration**: Old nodes → unified nodes by mapping `meta.type` to `layout/style`:
   - `section` → `heading` (`style.level=1|2`) + following `container` when needed.
   - `item` → `container` or `paragraph` depending on presence of bullets.
   - `bullet` → `list-item`.
3. **UI Components**: point old `ResumeSection/Item/Bullet` wrappers to new generic components or remove in favor of a single `Block` component.
4. **Tests**: snapshot migrate a few real PDFs; assert same visual ordering and addressing.

---

## 9) Examples

### 9.1 Minimal Tree
```
1   heading  Title
2   heading  Experience
  2.1 container  Job — Company
    2.1.1 list-item  Reduced latency 45%
3   heading  Skills
  3.1 paragraph  Languages: Java, TS, SQL
```

### 9.2 Chat Reference
- User: "Improve **2.1.1** with concrete numbers."
- Agent (action): `{ action:'replaceText', id:'2.1.1', text:'Reduced p95 latency 47% using Redis + batching (from 420ms→220ms).' }`

---

## 10) Validation & Constraints

- Enforce:
  - `uid` uniqueness
  - `layout` ∈ `LayoutKind`
  - Stable addresses recomputed after every mutation
- Lint rule suggestions:
  - Heading at depth 0 should usually be `style.level` ≤ 2
  - Avoid empty `container` nodes
  - Prefer `list-item` without multi‑paragraph `text`

---

## 11) Testing

- **Unit**: numbering, handlers, serializer, migration adapters
- **Integration**: PDF → Tree inference on fixture resumes
- **E2E**: User chat modifies nodes by address; preview updates and exports are consistent

---

## 12) Deliverables

- Updated `types/` with unified `ResumeNode`
- New generic `ActionHandler` and adapters
- Revised `serializeForLLM` and system prompt block
- PDF inference updates for `layout/style`
- Migration script for legacy trees
- Component refactor to generic `Block` renderer

