import { BaseExecutor, MessageCallback } from './baseExecutor'
import { RunRequest, DebugRequest, TraceFrame, TraceVariable } from '../types'
import { GDBDriver } from '../tracer/gdbDriver'
import { logger } from '../utils/logger'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

const isWindows = os.platform() === 'win32'
const MAX_DEBUG_FRAMES = 3000

export class CppExecutor extends BaseExecutor {
  protected isC(): boolean {
    return false
  }
  protected ext(): string {
    return this.isC() ? '.c' : '.cpp'
  }
  protected stdFlag(): string {
    return this.isC() ? '-std=c11' : '-std=c++17'
  }
  protected compiler(): string {
    return this.isC() ? this.runtimes.gcc : this.runtimes.gpp
  }

  protected compile(
    id: string,
    srcFile: string,
    binFile: string,
    cb: MessageCallback,
    extraArgs: string[]
  ): Promise<boolean> {
    return new Promise((resolve) => {
      logger.info(`Compiling ${this.compiler()} ${srcFile} -> ${binFile}`)
      this.pm.spawn(id + '_compile', {
        cmd: this.compiler(),
        args: [srcFile, '-o', binFile, ...extraArgs],
        cwd: os.tmpdir(),
        onStdout: () => {},
        onStderr: (line) => {
          if (line.trim()) this.emitOutput(cb, line, 'stderr')
        },
        onExit: (code) => {
          if (code !== 0) {
            this.emitError(cb, 'Compilation failed. See errors above.', 'compile')
            resolve(false)
          } else {
            resolve(true)
          }
        },
        onError: (err) => {
          this.emitError(cb, err.message, 'compile')
          resolve(false)
        },
        timeoutMs: 30_000,
      })
    })
  }

  // ── RUN ──────────────────────────────────────────────────
  async run(req: RunRequest, cb: MessageCallback): Promise<void> {
    this.requestId = req.id
    this.startTime = Date.now()

    const tmpDir = os.tmpdir()
    const src = path.join(tmpDir, `algolens_${req.id}${this.ext()}`)
    const bin = path.join(tmpDir, `algolens_${req.id}${isWindows ? '.exe' : ''}`)
    fs.writeFileSync(src, req.code, 'utf8')

    const cleanup = () => {
      try {
        fs.unlinkSync(src)
      } catch {}
      try {
        fs.unlinkSync(bin)
      } catch {}
    }

    const compiled = await this.compile(req.id, src, bin, cb, [this.stdFlag(), '-O0'])
    if (!compiled) {
      cleanup()
      this.emitComplete(cb, 1)
      return
    }

    await new Promise<void>((resolve) => {
      this.pm.spawn(req.id + '_run', {
        cmd: bin,
        args: [],
        cwd: tmpDir,
        onStdout: (line) => this.emitOutput(cb, line, 'stdout'),
        onStderr: (line) => this.emitOutput(cb, line, 'stderr'),
        onExit: (code) => {
          cleanup()
          this.emitComplete(cb, code)
          resolve()
        },
        onError: (err) => {
          cleanup()
          this.emitError(cb, err.message, 'runtime')
          resolve()
        },
        timeoutMs: 15_000,
      })
    })
  }

  // ── DEBUG (GDB-MI) ───────────────────────────────────────
  async debug(req: DebugRequest, cb: MessageCallback): Promise<void> {
    this.requestId = req.id
    this.startTime = Date.now()

    const tmpDir = os.tmpdir()
    const src = path.join(tmpDir, `algolens_dbg_${req.id}${this.ext()}`)
    const bin = path.join(tmpDir, `algolens_dbg_${req.id}${isWindows ? '.exe' : ''}`)
    fs.writeFileSync(src, req.code, 'utf8')

    const cleanupFiles = () => {
      try {
        fs.unlinkSync(src)
      } catch {}
      try {
        fs.unlinkSync(bin)
      } catch {}
    }

    const compiled = await this.compile(req.id, src, bin, cb, [
      this.stdFlag(),
      '-O0',
      '-g3',
    ])
    if (!compiled) {
      cleanupFiles()
      this.emitComplete(cb, 1)
      return
    }

    const srcBase = path.basename(src).toLowerCase()
    const frames: TraceFrame[] = []
    let frameIndex = 0
    let prevVars: Record<string, string> = {}

    let gdbProc
    try {
      gdbProc = spawn(
        this.runtimes.gdb,
        ['--interpreter=mi2', '--quiet', '--args', bin],
        { stdio: ['pipe', 'pipe', 'pipe'], cwd: tmpDir }
      )
    } catch (err) {
      this.emitError(
        cb,
        `Could not start GDB: ${err instanceof Error ? err.message : String(err)}`,
        'runtime'
      )
      cleanupFiles()
      this.emitComplete(cb, 1)
      return
    }

    const gdb = new GDBDriver(gdbProc)
    gdb.on('output', (text: string) => {
      if (text.trim()) this.emitOutput(cb, text, 'stdout')
    })

    return new Promise((resolve) => {
      let running = true

      const finish = (code: number) => {
        if (!running) return
        running = false
        try {
          gdbProc.kill()
        } catch {}
        cleanupFiles()
        this.emitComplete(cb, code, frames.length)
        resolve()
      }

      gdb.on('async', async (record) => {
        if (!running) return
        if (record.class !== 'stopped') return

        const reason = record.data['reason']

        if (reason === 'exited-normally' || reason === 'exited') {
          const code = parseInt(record.data['exit-code'] ?? '0', 10)
          finish(Number.isNaN(code) ? 0 : code)
          return
        }
        if (reason === 'signal-received' || reason === 'exited-signalled') {
          this.emitOutput(
            cb,
            `Program received signal ${record.data['signal'] ?? ''}`,
            'stderr'
          )
          finish(-1)
          return
        }

        if (frameIndex > MAX_DEBUG_FRAMES) {
          gdb.command('-exec-continue')
          return
        }

        const lineNum = parseInt(record.data['line'] ?? '0', 10)
        const fullname = (record.data['fullname'] ?? '').toLowerCase()
        const inUserFile =
          fullname.length === 0 || path.basename(fullname) === srcBase

        if (lineNum > 0 && inUserFile) {
          const gdbVars = await gdb.getVariables().catch(() => [])
          const stack = await gdb.getCallStack().catch(() => [])

          // Expand decayed array pointers (C passes `int arr[]` as `int*`) into
          // element lists using a size variable, so the visualizer gets values.
          const sizeVar = gdbVars.find(
            (v) => /^(n|size|len|count|N|length)$/.test(v.name) && /^-?\d+$/.test(v.value)
          )
          const sizeN = sizeVar ? parseInt(sizeVar.value, 10) : 0
          if (sizeN > 0 && sizeN <= 256) {
            for (const v of gdbVars) {
              // A pointer/decayed-array value contains a hex address and is not
              // already an expanded brace list.
              const looksLikePointer =
                /0x[0-9a-f]{3,}/i.test(v.value) && !v.value.includes('{')
              if (looksLikePointer) {
                const ev = await gdb.evaluate(`*${v.name}@${sizeN}`).catch(() => null)
                if (ev && ev.includes('{')) v.value = ev
              }
            }
          }

          const variables: Record<string, TraceVariable> = {}
          for (const v of gdbVars) {
            variables[v.name] = {
              name: v.name,
              value: v.value,
              type: v.type,
              changed: prevVars[v.name] !== v.value,
            }
          }
          prevVars = Object.fromEntries(gdbVars.map((v) => [v.name, v.value]))

          const callStack = stack.map((s) => ({
            functionName: s.func,
            lineNumber: parseInt(s.line, 10) || 0,
            filename: path.basename(src),
          }))

          const frame: TraceFrame = {
            type: 'frame',
            id: req.id,
            frameIndex: frameIndex++,
            lineNumber: lineNum,
            variables,
            stepType: 'line',
            callStack,
            sourceCode: req.code,
          }
          frames.push(frame)
          cb(frame)
        }

        if (running) gdb.command('-exec-step')
      })

      gdbProc.on('exit', () => finish(0))
      gdbProc.on('error', (err) => {
        this.emitError(cb, err.message, 'runtime')
        finish(1)
      })

      setTimeout(() => {
        if (running) {
          this.emitOutput(cb, 'Debug session timed out.', 'stderr')
          finish(-1)
        }
      }, 10_000)

      // Pretty-printing renders std::vector etc. as "... = {64, 34, ...}".
      gdb.command('-enable-pretty-printing')
      // Break at main, run to it, then step line by line.
      gdb.command('-break-insert main')
      gdb.command('-exec-run')
    })
  }
}
