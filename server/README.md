# AlgoLens — Execution Server

A WebSocket server that **runs and debugs** user code and streams the results
back to the AlgoLens frontend. It powers three things: **Run** (stdout/stderr),
**Debug/Step** (a frame-by-frame execution trace), and **empirical complexity**
analysis (running code at several input sizes and counting operations).

Part of the AlgoLens project — see also [`../frontend`](../frontend) and
[`../desktop`](../desktop).

- **Address:** `ws://localhost:3001`
- **Runtime:** [bun](https://bun.sh) (runs the TypeScript directly — no build step)

## Prerequisites

- **bun**
- The language toolchains you want to support, on `PATH`:

| Language | Needs | Used for |
|----------|-------|----------|
| Python | `python3` | run + trace (`sys.settrace`) |
| JavaScript | `node` | run + trace (V8 inspector) |
| C / C++ | `gcc` / `g++`, `gdb` | run + trace (GDB/MI) |
| Java | `javac`, `java` | run + trace (JDI) |

Missing toolchains are fine — the server reports which runtimes are available
to the client (`runtime-status`), and the others are simply marked unavailable.

## Running

```bash
bun install
bun run dev      # watch mode (auto-restart on change)
bun run start    # one-off
bun run typecheck
```

In the desktop app this server is **started automatically** by `AlgoLens.exe`.
With the frontend dev server, use `bun run dev:full` from `../frontend`.

## Protocol

JSON messages over WebSocket (types live in [`src/types.ts`](./src/types.ts),
mirrored on the frontend in `lib/executionTypes.ts`).

**Client → server:** `run`, `debug`, `stop`, `complexity`
**Server → client:** `ready`, `runtime-status`, `output`, `frame`, `complete`,
`error`, `complexity-progress`, `complexity-result`

Each `frame` carries the line number, variable states, step type, and call
stack — this is what drives the debugger's step view and the classifier.

## Structure

```
src/
  index.ts                WebSocket server + message routing
  types.ts                Shared protocol types
  executor/
    baseExecutor.ts        Shared run/debug lifecycle
    pythonExecutor.ts  javascriptExecutor.ts
    cExecutor.ts  cppExecutor.ts  javaExecutor.ts
    complexityRunner.ts    Runs code at multiple input sizes, counts frames
    index.ts               createExecutor(language)
  tracer/
    pythonTracer.py        sys.settrace tracer
    jsTracer.js            V8 inspector (CDP) tracer
    gdbDriver.ts           GDB/MI driver for C/C++
    JavaTracer.java        JDI tracer
  sandbox/processManager.ts  Spawns processes, enforces timeouts, tree-kill
  utils/                   logger, runtime path resolution
```

## Complexity analysis

The `complexity` request runs the program at increasing input sizes (replacing
the last array literal with a generated array of size *n*), counts the trace
frames as the operation count, and returns the measurements. The frontend fits
a Big-O curve to them. **Supported for Python and JavaScript** in this phase
(C/C++/Java are slower to instrument and are deferred).

## Security note

This server executes **arbitrary user code** on the host with real toolchains.
It is intended for **local development only** (localhost) and must not be
exposed to a network. Processes are time-limited and killed on stop/disconnect.

## License

MIT — see [LICENSE](../LICENSE). Bundled runtime dependencies (`ws`,
`tree-kill`) retain their own licenses.
