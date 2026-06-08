# AlgoLens — Frontend

The editor + visualizer UI for **AlgoLens**, a desktop DSA (data structures &
algorithms) visualizer. This is the web layer: a VS Code–style editor that runs
and debugs code, classifies the algorithm, and renders a live step-by-step
visualization.

It is one of three parts of the project:

| Part | Path | Role |
|------|------|------|
| **Frontend** (this) | `frontend/` | Editor + classifier + visualizer UI (Next.js) |
| Execution server | [`../algolens-server`](../algolens-server) | Runs/debugs code, streams output + trace frames |
| Desktop shell | [`../desktop`](../desktop) | Packages this UI as a native Windows app |

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Zustand** for state, **Monaco** for the editor
- Static export (`output: 'export'`) so the desktop shell can serve it offline

> ⚠️ See [`AGENTS.md`](./AGENTS.md): this Next.js version has breaking changes
> vs. older docs — check `node_modules/next/dist/docs/` before relying on
> training-data assumptions.

## Prerequisites

- [bun](https://bun.sh) (used for all frontend + server commands — not npm)
- The [execution server](../algolens-server) running for Run/Debug to work

## Getting started

```bash
bun install

# UI only (Run/Debug need the server too — see below)
bun run dev            # http://localhost:3000

# UI + execution server together
bun run dev:full
```

`bun run server` starts just the execution server (`ws://localhost:3001`).

## Build

```bash
bun run build          # static export → ./out
```

The `out/` directory is what the desktop shell serves. After changing the UI,
rebuild and the desktop can pick it up (see the desktop README).

## Project structure

```
app/                     Next.js app router entry (page.tsx renders <Editor/>)
components/editor/
  Editor.tsx             Top-level layout + execution/debug orchestration
  monaco/                Monaco editor wrapper
  explorer/              File explorer (File System Access API)
  tabs/ terminal/ toolbar/ statusbar/ menubar/
  settings/              SettingsPanel — Claude / Gemini API keys
  visualizer/            AlgorithmBadge, IRPreview, FrameScrubber,
                         QAPanel (Ask AI), ComplexityChart (Analysis)
lib/
  classifier/            Hybrid classifier (tier1 patterns, tier2 names,
                         tier3 LLM) + Visual IR emitters + narration
  ai/client.ts           Unified Claude/Gemini chat client (chatAI)
  executionClient.ts     WebSocket client to the execution server
  executionTypes.ts      Shared protocol types (mirror of server types)
store/                   Zustand stores (classifier, trace)
```

## Features

- **Editor + execution** — open a folder, edit, **Run** (stdout/stderr) and
  **Debug** (step-by-step trace) across Python, JavaScript, C, C++, Java.
- **Hybrid classifier** — identifies the algorithm via Tier 1 (trace pattern
  match), Tier 2 (name heuristics), and Tier 3 (LLM), producing a **Visual IR**.
- **Visualizer** — renders arrays/graphs/etc. and steps through frames with a
  scrubber and narration.
- **AI features** (optional, Phase 6) — step **narrator**, context-aware
  **Ask AI** about the current step, and **empirical complexity** analysis.

## API keys (optional)

The AI features use **Claude** or **Gemini**. Add a key in **Settings** (gear
icon). Keys are stored in `sessionStorage` (`algolens_api_key` /
`algolens_gemini_key`); Gemini is preferred when both are set. Everything else
works without a key — AI only enhances, it never gates.

## License

MIT — see [LICENSE](../LICENSE). Third-party components retain their own
licenses; see [THIRD-PARTY-NOTICES.txt](../THIRD-PARTY-NOTICES.txt).
