# 🔍 Mink Codebase Deep Analysis, Audit & Optimization Roadmap

This document provides a comprehensive technical audit of the **Mink** desktop application codebase, covering architecture, performance bottlenecks, memory management, security boundaries, and an actionable optimization roadmap.

---

## 1. 🚨 Critical Performance & Runtime Bottlenecks

### A. Re-render & Redundant Disk Read Loop on File Modifications

- **File & Lines:** [`src/renderer/src/App.tsx:L353-L391`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/App.tsx#L353-L391) and [`src/renderer/src/App.tsx:L432-L436`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/App.tsx#L432-L436)
- **Root Cause:**
  `loadFileContent` lists `[fileContents, workspacePath]` in its `useCallback` dependency array. When a note is edited or loaded, `setFileContents` mutates state, regenerating the `loadFileContent` function instance. This in turn triggers the `useEffect` watching `[openFiles, loadFileContent]`, which re-reads all open files from the filesystem on every keystroke/content change.
- **Remediation:**
  Refactor `loadFileContent` to use functional state updates (`setFileContents(prev => ...)`) and remove `fileContents` from its dependencies.

---

### B. Synchronous Main Thread Freezing during Graph Data Generation

- **File & Lines:** [`src/main/index.ts:L228-L296`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/main/index.ts#L228-L296)
- **Root Cause:**
  `fs:getGraphData` calls `getMarkdownFiles`, using synchronous `readdirSync` and `statSync` across the vault, followed by synchronous `readFileSync` on all notes in a sequential loop directly on Electron's main process UI thread. Additionally, wikilink resolution performs an $O(N)$ lookup (`nodes.find(...)`) per link, resulting in $O(N \cdot M)$ complexity.
- **Remediation:**
  1. Migrate directory traversal and file reads to asynchronous `fs.promises`.
  2. Implement an in-memory `Map<string, string>` (lowercase note title $\rightarrow$ node ID) for $O(1)$ link resolution.

---

### C. Unbounded $O(N^2)$ Canvas Simulation Loop

- **File & Lines:** [`src/renderer/src/components/GraphView.tsx:L104-L200`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/components/GraphView.tsx#L104-L200)
- **Root Cause:**
  `runSimulation` invokes `requestAnimationFrame` continuously, calculating $O(N^2)$ node-to-node repulsion forces indefinitely even after velocities have settled to 0. This causes non-zero background CPU load and battery drain.
- **Remediation:**
  Track kinetic energy ($\sum (v_x^2 + v_y^2)$). When energy falls below a threshold $\epsilon$, halt the animation loop. Re-activate simulation dynamically upon user interactions (hover, drag, zoom, pan).

---

### D. Missing High-DPI (Retina) Canvas Scaling

- **File & Lines:** [`src/renderer/src/components/GraphView.tsx:L60-L65`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/components/GraphView.tsx#L60-L65)
- **Root Cause:**
  The canvas dimensions are set directly to CSS pixel sizes without factoring in `window.devicePixelRatio`. On 4K, macOS Retina, and Windows display scaling (125%, 150%), canvas text and node edges render blurry.
- **Remediation:**
  Multiply internal canvas width and height by `devicePixelRatio` and scale the 2D context using `ctx.scale(dpr, dpr)`.

---

## 2. 🏗️ Architecture, State Management & Dead Code

### A. Monolithic `App.tsx` Component

- **File:** [`src/renderer/src/App.tsx`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/App.tsx) (>1200 lines)
- **Issue:**
  `App.tsx` coordinates workspace discovery, tab handling, editor lifecycle, floating window state, status bar configurations, and resize listeners simultaneously.
- **Recommended Modularization:**
  - `useWorkspaceManager`: Workspace selection, path normalization, renaming, and recent workspace persistence.
  - `useFileManager`: Open tab states, active file tracking, file content caches, and dirty/unsaved state.
  - `useEditorSettings`: Font family, font size, tabs toggle, and view modes.

---

### B. Duplicate Heading Extraction in Outline Widget

- **File:** [`src/renderer/src/components/layout/OutlineWidget.tsx:L35-L55`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/components/layout/OutlineWidget.tsx#L35-L55)
- **Issue:**
  The background Web Worker ([`indexerWorker.ts`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/workers/indexerWorker.ts)) already parses headings via `PARSE_HEADINGS`. However, `OutlineWidget` synchronously splits and parses the document text on the main UI thread on every render.
- **Remediation:**
  Consume `headings` directly from `useIndexerWorker` into `OutlineWidget`.

---

### C. Dead Code & Unused Dependencies

- **Unused Dependency:** `@monaco-editor/react` is in `package.json` but is never imported in `src/`.
- **Duplicate Component:** [`src/renderer/src/components/TabBar.tsx`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/components/TabBar.tsx) is an orphaned duplicate of [`src/renderer/src/components/layout/TabBar.tsx`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/components/layout/TabBar.tsx).
- **Template Boilerplate:** [`src/renderer/src/components/Versions.tsx`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/components/Versions.tsx) and [`src/renderer/src/components/layout/TerminalPanel.tsx`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/components/layout/TerminalPanel.tsx) are unreferenced.

---

## 3. 💾 Storage, File I/O & Media Handling

### A. Base64 DataURL Image Inlining

- **File & Lines:** [`src/renderer/src/components/BlockEditor.tsx:L657-L671`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/components/BlockEditor.tsx#L657-L671)
- **Issue:**
  Images added to notes are converted into base64 DataURLs and saved directly within the `.md` file. This inflates markdown file sizes by megabytes, causing CPU spikes during regex matching and frontmatter serialization.
- **Remediation:**
  Save uploaded media to a local `.attachments` or `assets` folder inside the workspace and embed relative paths (`![image](assets/photo.png)`).

---

### B. Deprecated DOM APIs in Block Editor

- **File & Lines:** [`src/renderer/src/components/BlockEditor.tsx:L772, L825`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/components/BlockEditor.tsx#L772)
- **Issue:**
  - `document.execCommand('insertLineBreak')` is deprecated across modern browser standards.
  - `document.caretRangeFromPoint` is non-standard WebKit legacy.
- **Remediation:**
  Replace with standard DOM Selection/Range manipulation and `document.caretPositionFromPoint`.

---

## 4. 🔒 Security & Electron Hardening

### A. Path Traversal Validation

- **File & Lines:** [`src/main/index.ts:L135-L170`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/main/index.ts#L135-L170)
- **Issue:**
  File system IPC handlers (`fs:readFile`, `fs:writeFile`, `fs:deletePath`, `fs:renamePath`) execute operations without verifying that the requested path falls within the permitted active workspace boundary.
- **Remediation:**
  Validate file paths against allowed root directories before executing filesystem modifications.

---

### B. Window Control IPC Listener Deduplication

- **File & Lines:** [`src/main/index.ts:L50-L67`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/main/index.ts#L50-L67)
- **Issue:**
  `window:minimize`, `window:maximize`, and `window:close` IPC handlers are bound inside `createWindow()`. If `createWindow()` is triggered multiple times, duplicate event listeners are attached.
- **Remediation:**
  Move IPC registrations to `app.whenReady()` outside `createWindow()`.

---

## 5. 🎨 CSS Architecture

### Monolithic `main.css` (>4500 lines)

- **File:** [`src/renderer/src/assets/main.css`](file:///c:/Users/dwaip/OneDrive/Documents/Application/src/renderer/src/assets/main.css)
- **Issue:**
  All styles (design tokens, editor overrides, modal layouts, floating widgets, and widgets) reside in a single unpartitioned stylesheet.
- **Recommended Breakdown:**
  - `tokens.css` (variables, colors, typography tokens)
  - `layout.css` (app frame, headers, sidebars, tabs, status bar)
  - `editor.css` (EditorJS customizations, wikilinks, code blocks)
  - `widgets.css` (floating windows, quick terminal, assistant, plugins)

---

## 📋 Prioritized Action Matrix

| Priority | Optimization Item                                   | Targeted File(s)              | Benefit                                                |
| :------- | :-------------------------------------------------- | :---------------------------- | :----------------------------------------------------- |
| **P0**   | Fix re-render & disk read loop in `loadFileContent` | `App.tsx`                     | Eliminates repeated filesystem reads during editing    |
| **P0**   | Async graph data generation & $O(1)$ lookup map     | `src/main/index.ts`           | Prevents main thread UI freezing on opening Graph      |
| **P1**   | Graph simulation cooling / energy threshold sleep   | `GraphView.tsx`               | Reduces idle background CPU usage to 0%                |
| **P1**   | High-DPI canvas retina scaling                      | `GraphView.tsx`               | Crisp, sharp text and nodes on high-resolution screens |
| **P1**   | Clean dead code & remove `@monaco-editor/react`     | `package.json`, `components/` | Reduces bundle size and cleans project structure       |
| **P2**   | Integrate Web Worker headings with `OutlineWidget`  | `OutlineWidget.tsx`           | Offloads heading parsing from the main UI thread       |
| **P2**   | Move window IPC listeners outside `createWindow()`  | `src/main/index.ts`           | Prevents duplicate listener registration               |
| **P3**   | Split `main.css` into modular stylesheets           | `main.css`                    | Improves CSS maintainability and load structure        |
