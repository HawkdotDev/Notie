<div align="center">

<img src="./resources/oink.png" width="80" height="80" alt="Oink Logo" />

# Oink

<p align="center">
  <strong>Local-First • Hybrid Block-Markdown Knowledge Base • Canvas Graph Visualizer</strong>
</p>

<p align="center">
  <a href="https://github.com/HawkdotDev/oink/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-%3E%3D20.0.0-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js Version" /></a>
  <a href="https://www.electronjs.org"><img src="https://img.shields.io/badge/Electron-v39-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-v19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-v5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://vite.dev"><img src="https://img.shields.io/badge/Vite-v7-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" /></a>
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#technology-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-architecture">Architecture</a> •
  <a href="#keyboard-shortcuts">Shortcuts</a> •
  <a href="#contributing">Contributing</a>
</p>

---

</div>

## Overview

**Oink** is a modern, high-performance, local-first markdown workspace and knowledge management platform designed for developers, researchers, and creators.

By combining the block-editing ergonomics of modern canvas tools with the portable, open-standards durability of plain text `.md` files, Oink offers a powerful editing environment with zero vendor lock-in, zero cloud telemetry, and complete offline privacy.

---

## Key Features

### 📂 1. Local-First & Zero Lock-In

- **Plain Markdown Storage**: All documents are stored directly as human-readable `.md` files on your local file system.
- **Git Friendly**: Works natively with Git version control, Obsidian vaults, Logseq directories, and any standard text editor.
- **Offline Reliability**: Instant startup and sub-millisecond file interactions without cloud dependencies.

### 📝 2. Hybrid Block-Markdown Editing Engine

- **Rich Interactive Blocks**: Seamlessly convert between raw markdown and structured blocks (Headings, Checklists, Nested Lists, Code Fences, Tables, Blockquotes, Delimiters, and Inline Callouts).
- **Media & Embed Support**: Drag-and-drop local images, embed web videos (`.mp4`, YouTube, Vimeo, CodePen), and customize captions directly.
- **KaTeX Mathematics**: Native inline and block-level LaTeX rendering (`$math$` and `$$equation$$`).

### 🕸️ 3. Bi-Directional Wikilinks & Canvas Knowledge Graph

- **Interlinked Knowledge**: Create connections using `[[Note Name]]` wikilinks with auto-completion and click-to-navigate.
- **Interactive Force-Directed Graph**: Hardware-accelerated canvas graph that visualizes node relationships, connection density, and orphan documents in real time.

### 🎨 4. Deep Page & Typography Customization

- **Per-Page Styling**: Configure font family, font size, line height, letter spacing, font weight, and text alignment per document or globally.
- **Visual Covers & Emojis**: Add Unsplash photography or gradient banners, custom emoji icons, and toggleable title headers with YAML frontmatter persistence.
- **Distraction-Free Full-Screen Mode**: Hide peripheral toolbars and sidebars for an immersive writing session.

### 🪟 5. Floating Multi-Tool Widget Ecosystem

Draggable, resizable, floating desktop tool panels that overlay your workspace:

- 📑 **Document Outline Widget**: Dynamic heading tree with jump-to-section navigation.
- 🤖 **Assistant Panel**: Local diagnostic scanner for passive voice, wordiness, grammar suggestions, and AI integrations.
- 💻 **Quick Terminal**: Embedded dev log monitor and shell command runner.
- 🧩 **Extensions & Plugins Widget**: Modular extension manager to toggle KaTeX, Daily Journals, Pomodoro timers, and diagrams.
- 📊 **Document Statistics**: Live word count, character count, estimated reading time, and language indicators.
- 📋 **Code Snippets Library**: Instant code templates for Python, TypeScript, SQL, JSON, and Markdown tables.

---

## Technology Stack

| Component               | Technology                                                                                                  | Description                                                              |
| :---------------------- | :---------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| **Runtime**             | [Electron 39](https://www.electronjs.org/)                                                                  | Cross-platform desktop runtime with secure IPC architecture              |
| **UI Framework**        | [React 19](https://react.dev/)                                                                              | Modern concurrent UI engine with functional hooks                        |
| **Language**            | [TypeScript 5.9](https://www.typescriptlang.org/)                                                           | Strict type checking across main, preload, and renderer layers           |
| **Build Tooling**       | [electron-vite](https://electron-vite.org/) / [Vite 7](https://vite.dev/)                                   | High-speed HMR bundling and multi-target compilation                     |
| **Styling**             | [Vanilla CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) + [TailwindCSS 4](https://tailwindcss.com/) | Custom Brutalist dark theme with responsive glassmorphic overlays        |
| **Editor Core**         | [Editor.js](https://editorjs.io/)                                                                           | Block-based modular editing framework with custom markdown adapters      |
| **Icons**               | [Lucide React](https://lucide.dev/)                                                                         | Lightweight, consistent SVG icon system                                  |
| **Background Indexing** | [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)                             | Asynchronous tokenization, metadata parsing, and wikilink graph indexing |

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** `>= 20.0.0`
- **npm**, **bun**, or **pnpm**

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/HawkdotDev/oink.git
   cd oink
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## Build & Distribution

To package Oink as a native desktop binary:

```bash
# Package for current OS (unpacked directory)
npm run build:unpack

# Build Windows installer (.exe)
npm run build:win

# Build macOS package (.dmg / .zip)
npm run build:mac

# Build Linux package (.AppImage / .deb)
npm run build:linux
```

Output binaries will be generated in the `dist/` directory.

---

## Project Architecture

```
oink/
├── electron-builder.yml        # Distribution packaging configuration
├── electron.vite.config.ts     # Vite multi-target configuration (main, preload, renderer)
├── src/
│   ├── main/                   # Electron main process (lifecycle, window, FS IPC)
│   │   └── index.ts
│   ├── preload/                # Context isolation bridge & secure API exposure
│   │   ├── index.ts
│   │   └── index.d.ts
│   └── renderer/               # React client workspace
│       ├── index.html          # Application entry shell
│       └── src/
│           ├── assets/         # Design tokens, typography & base/main styling
│           ├── components/     # Core editor, tree, modals, graph & pickers
│           │   ├── layout/     # TopHeader, SubHeader, TabBar, Sidebar, Widgets
│           │   │   └── subheader/  # PageActionsMenu, ShareMenu, ViewModeMenu, WidgetsMenu
│           │   ├── BlockEditor.tsx
│           │   ├── FileTree.tsx
│           │   ├── GraphView.tsx
│           │   └── SettingsModal.tsx
│           ├── hooks/          # Persistent state, sidebar resizing, widget manager
│           ├── types/          # Shared TypeScript interfaces & types
│           ├── utils/          # Markdown converters, frontmatter engines, path normalization
│           └── workers/        # Dedicated web workers for graph & search indexing
```

---

## Keyboard Shortcuts

| Shortcut              | Action                        | Scope  |
| :-------------------- | :---------------------------- | :----- |
| `Ctrl + N`            | Create New Document           | Global |
| `Ctrl + O`            | Open Workspace Directory      | Global |
| `Ctrl + S`            | Force Save Document           | Editor |
| `Ctrl + P`            | Quick Open / File Search      | Global |
| `Ctrl + Shift + F`    | Toggle Full-Screen Focus Mode | Editor |
| `Ctrl + B`            | Toggle Left Sidebar           | Global |
| `Ctrl + G`            | Open Graph Visualization View | Global |
| `Ctrl + ,`            | Open Settings & Preferences   | Global |
| `Tab` / `Shift + Tab` | Indent / Outdent Block Item   | Editor |

---

## Code Quality & Standards

Oink maintains strict type safety and code quality standards:

```bash
# Type check TypeScript across all targets
npm run typecheck

# Run ESLint validation
npm run lint

# Format codebase with Prettier
npm run format
```

---

## Contributing

Contributions, feature suggestions, and bug reports are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please review our [Contributing Guidelines](CONTRIBUTING.md) and ensure all linting and typecheck passes before submitting PRs.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.

<div align="center">
  <br />
  <sub>Built with care by the Oink Open Source Community.</sub>
</div>
