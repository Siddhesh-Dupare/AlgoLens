import { WebSocketServer } from "ws";
import * as os from "node:os";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import * as pty from "node-pty";

const PORT = 3002; // 3001 is the bun server; use a different port

// ── Shell detection ─────────────────────────────────────────────────────────
function which(exe) {
  try {
    const cmd = os.platform() === "win32" ? "where" : "which";
    const out = execSync(`${cmd} ${exe}`, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .split(/\r?\n/)[0]
      .trim();
    return out || null;
  } catch {
    return null;
  }
}

function findGitBash() {
  const candidates = [
    "C:\\Program Files\\Git\\bin\\bash.exe",
    "C:\\Program Files\\Git\\usr\\bin\\bash.exe",
    "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
  ];
  // Derive from git on PATH:  ...\Git\cmd\git.exe -> ...\Git\bin\bash.exe
  const git = which("git");
  if (git) {
    const gitRoot = path.resolve(path.dirname(git), "..");
    candidates.unshift(path.join(gitRoot, "bin", "bash.exe"));
  }
  return candidates.find((c) => fs.existsSync(c)) || null;
}

let _shells = null;
function detectShells() {
  if (_shells) return _shells;
  const shells = [];
  if (os.platform() === "win32") {
    shells.push({ id: "powershell", label: "PowerShell", file: "powershell.exe", args: [] });
    const pwsh = which("pwsh.exe");
    if (pwsh) shells.push({ id: "pwsh", label: "PowerShell 7", file: pwsh, args: [] });
    const gitBash = findGitBash();
    if (gitBash) shells.push({ id: "gitbash", label: "Git Bash", file: gitBash, args: ["--login", "-i"] });
    shells.push({ id: "cmd", label: "Command Prompt", file: "cmd.exe", args: [] });
  } else {
    shells.push({ id: "bash", label: "Bash", file: "bash", args: [] });
    const zsh = which("zsh");
    if (zsh) shells.push({ id: "zsh", label: "Zsh", file: zsh, args: [] });
  }
  _shells = shells;
  return shells;
}

// What the client may safely see (no absolute paths needed for the dropdown).
function publicShells() {
  return detectShells().map(({ id, label }) => ({ id, label }));
}

// ── WebSocket server ────────────────────────────────────────────────────────
// Catch process-level errors so the terminal server logs them, not dies silently.
process.on("uncaughtException", (err) => console.error("[terminal] uncaught:", err));
process.on("unhandledRejection", (reason) => console.error("[terminal] rejection:", reason));

// 127.0.0.1 only — never expose a shell on the network.
const wss = new WebSocketServer({ host: "127.0.0.1", port: PORT });
console.log(`Terminal server on ws://127.0.0.1:${PORT}`);

wss.on("connection", (ws) => {
  let ptyProcess = null;

  function spawnShell(shellId, cols, rows) {
    const shells = detectShells();
    const shell = shells.find((s) => s.id === shellId) || shells[0];
    try {
      ptyProcess = pty.spawn(shell.file, shell.args, {
        name: "xterm-color",
        cols: cols || 80,
        rows: rows || 30,
        cwd: process.env.USERPROFILE || process.env.HOME || process.cwd(),
        env: process.env,
      });
    } catch (err) {
      console.error("[terminal] failed to start shell:", err);
      // Surface the failure inside the terminal so the user sees it.
      if (ws.readyState === ws.OPEN) {
        ws.send(`\r\n\x1b[31mFailed to start ${shell.label}: ${err.message}\x1b[0m\r\n`);
      }
      return;
    }
    ptyProcess.onData((data) => {
      if (ws.readyState === ws.OPEN) ws.send(data);
    });
    ptyProcess.onExit(() => {
      if (ws.readyState === ws.OPEN) ws.close();
    });
  }

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg.type === "listShells") {
      ws.send(JSON.stringify({ type: "shells", shells: publicShells() }));
    } else if (msg.type === "init") {
      if (!ptyProcess) spawnShell(msg.shell, msg.cols, msg.rows);
    } else if (msg.type === "input") {
      ptyProcess?.write(msg.data);
    } else if (msg.type === "resize") {
      ptyProcess?.resize(msg.cols, msg.rows);
    }
  });

  ws.on("close", () => ptyProcess?.kill());
});
