# AlgoLens

**See your data structures come alive.**

AlgoLens is an open-source desktop tool that runs your *real* code and
visualizes data structures — arrays, strings, stacks, queues, linked lists,
binary trees, graphs and hash maps — **step by step**, as the program executes.
Unlike fixed animations, AlgoLens traces the actual execution of code you write
in **Python, JavaScript, C++ or Java**.

> Built for an IEEE PuneCon 2026 paper on visualization for learning data
> structures & algorithms. **Beta — Windows.**

---

## ✨ Features

- **Every structure** — arrays, strings, stacks, queues, linked lists, binary/
  BST/n-ary trees, graphs and hash maps, each with a purpose-built view.
- **Step-by-step debugging** — run or debug your code and watch it execute line
  by line, with pointers, highlights and a moving cursor.
- **Scope-aware picture-in-picture** — a structure stays visible across function
  calls and recursion; others park into thumbnails and pop back when they change.
- **Multi-language** — Python, JavaScript, C++ and Java (real execution traces).
- **Native renderer** — a C++/OpenGL visualizer with playback, seek and speed.
- **Integrated editor + terminal** — a full code editor and a terminal
  (PowerShell or Git Bash) in one window.

---

## ⬇️ Download & install (Windows)

1. Get the latest installer from
   **[Releases](https://github.com/Siddhesh-Dupare/AlgoLens/releases)**
   (`AlgoLens-Setup-x.y.z-beta.exe`).
2. Run it. Windows SmartScreen may warn ("Windows protected your PC") →
   **More info → Run anyway** (the beta isn't code-signed yet).
3. Launch AlgoLens, write or open code, and press **Run** or **Debug**.

**Requirements**

- Windows 10/11 (64-bit)
- **Python 3.x** installed (tick *"Add Python to PATH"*) — AlgoLens detects it
  automatically. C/C++ needs a compiler (gcc/g++/gdb); Java needs a JDK.

---

## 🗂 Repository structure (monorepo)

| Folder      | What it is                                                |
| ----------- | --------------------------------------------------------- |
| `app/`      | The editor UI (Vue 3 + Vite), served inside the shell     |
| `desktop/`  | The native shell (C++, CEF, SDL3, OpenGL, NanoVG)         |
| `server/`   | The execution / tracing server (TypeScript, runs on bun)  |
| `terminal/` | The integrated terminal server (Node + node-pty)          |
| `web/`      | The marketing website (Next.js)                           |

---

## 🛠 Build from source

```bash
# Editor UI
cd app && npm install && npm run dev

# Execution server (port 3001)
cd server && bun install && bun run src/index.ts

# Terminal server (port 3002)
cd terminal && npm install && node index.js

# Website
cd web && npm install && npm run dev
```

The **desktop shell** uses CMake + MSVC and requires the
[Chromium Embedded Framework](https://cef-builds.spotifycdn.com/index.html)
placed in `desktop/external/cef`. Configure and build with CMake, then run the
resulting `AlgoLens.exe` (it launches the UI, servers and renderer).

---

## 🧪 Research study

AlgoLens is being evaluated for a paper at **IEEE PuneCon 2026**. If you'd like
to take part in a short, anonymous study (pre/post test + usability survey), see
the **Participate** page on the website, or open an issue to get involved.

---

## 🤝 Contributing

- **Bugs:** [open an issue](https://github.com/Siddhesh-Dupare/AlgoLens/issues/new?labels=bug)
- **Ideas / feature requests:** [start a discussion](https://github.com/Siddhesh-Dupare/AlgoLens/discussions/new?category=ideas)

Contributions and feedback are welcome — it's early, so expect rough edges.

---

## 📄 License

[MIT](LICENSE) © Siddhesh Anandrao Dupare
