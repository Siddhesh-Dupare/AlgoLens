import { execSync } from 'child_process'
import os from 'os'
import fs from 'fs'
import path from 'path'

export interface RuntimePaths {
  python: string
  node: string
  gcc: string
  gpp: string
  gdb: string
  java: string
  javac: string
}

const isWindows = os.platform() === 'win32'

// Windows Store "app execution aliases" live under WindowsApps and are 0-byte
// reparse stubs that cannot be spawned directly — skip them.
function isUsable(p: string): boolean {
  if (!p) return false
  if (isWindows && p.includes('WindowsApps')) return false
  return true
}

// Runtimes bundled by the installer live next to the app (one level above the
// server folder, which is <install>/server). Preferred over PATH.
const installRoot = path.resolve(process.cwd(), '..')
function bundled(...parts: string[]): string {
  return path.join(installRoot, ...parts)
}

function findBinary(names: string[], fallbacks: string[], preferred: string[] = []): string {
  // 0. Bundled runtimes take priority on installed builds.
  for (const p of preferred) {
    try {
      if (isUsable(p) && fs.existsSync(p)) return p
    } catch {
      // ignore
    }
  }
  for (const name of names) {
    try {
      const cmd = isWindows ? `where ${name}` : `which ${name}`
      const lines = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim()
        .split(/\r?\n/)
        .map((l) => l.trim())
      for (const line of lines) {
        if (isUsable(line)) return line
      }
    } catch {
      // try next name
    }
  }
  for (const fb of fallbacks) {
    try {
      if (isUsable(fb) && fs.existsSync(fb)) return fb
    } catch {
      // ignore
    }
  }
  // Let PATH resolve it at spawn time.
  return names[0]
}

let cached: RuntimePaths | null = null

export function resolveRuntimes(): RuntimePaths {
  if (cached) return cached
  cached = {
    python: findBinary(
      ['python3', 'python'],
      ['/usr/bin/python3', 'C:\\Python312\\python.exe'],
      [bundled('python', 'python.exe'), bundled('python', 'bin', 'python3')]
    ),
    node: findBinary(
      ['node'],
      [process.execPath, '/usr/local/bin/node', 'C:\\Program Files\\nodejs\\node.exe'],
      [bundled('node.exe'), bundled('bin', 'node')]
    ),
    gcc: findBinary(['gcc'], ['/usr/bin/gcc', 'C:\\MinGW\\bin\\gcc.exe']),
    gpp: findBinary(['g++'], ['/usr/bin/g++', 'C:\\MinGW\\bin\\g++.exe']),
    gdb: findBinary(['gdb'], ['/usr/bin/gdb', 'C:\\MinGW\\bin\\gdb.exe']),
    java: findBinary(['java'], ['/usr/bin/java', '/usr/local/bin/java']),
    javac: findBinary(['javac'], ['/usr/bin/javac', '/usr/local/bin/javac']),
  }
  return cached
}
