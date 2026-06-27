import { BaseExecutor, MessageCallback } from './baseExecutor'
import { RunRequest, DebugRequest, TraceFrame } from '../types'
import fs from 'fs'
import path from 'path'
import os from 'os'

const FRAME_PREFIX = '__ALGOLENS_FRAME__:'

export class JavaScriptExecutor extends BaseExecutor {
  async run(req: RunRequest, cb: MessageCallback): Promise<void> {
    this.requestId = req.id
    this.startTime = Date.now()

    const tmpDir = os.tmpdir()
    const tmpFile = path.join(tmpDir, `algolens_${req.id}.js`)
    fs.writeFileSync(tmpFile, req.code, 'utf8')

    return new Promise((resolve) => {
      this.pm.spawn(req.id, {
        cmd: this.runtimes.node,
        args: [tmpFile],
        cwd: tmpDir,
        onStdout: (line) => this.emitOutput(cb, line, 'stdout'),
        onStderr: (line) => this.emitOutput(cb, line, 'stderr'),
        onExit: (code) => {
          try {
            fs.unlinkSync(tmpFile)
          } catch {}
          this.emitComplete(cb, code)
          resolve()
        },
        onError: (err) => {
          this.emitError(cb, err.message, 'runtime')
          resolve()
        },
        timeoutMs: 15_000,
      })
    })
  }

  async debug(req: DebugRequest, cb: MessageCallback): Promise<void> {
    this.requestId = req.id
    this.startTime = Date.now()

    const tmpDir = os.tmpdir()
    const tmpFile = path.join(tmpDir, `algolens_debug_${req.id}.js`)
    fs.writeFileSync(tmpFile, req.code, 'utf8')

    const tracerPath = path.resolve(__dirname, '..', 'tracer', 'jsTracer.js')
    const frames: TraceFrame[] = []
    let frameIndex = 0

    return new Promise((resolve) => {
      this.pm.spawn(req.id, {
        cmd: this.runtimes.node,
        args: [tracerPath, tmpFile],
        cwd: tmpDir,
        onStdout: (line) => {
          if (line.startsWith(FRAME_PREFIX)) {
            try {
              const raw = JSON.parse(line.slice(FRAME_PREFIX.length))
              const frame: TraceFrame = {
                ...raw,
                type: 'frame',
                id: req.id,
                frameIndex: frameIndex++,
                sourceCode: req.code,
              }
              frames.push(frame)
              cb(frame)
            } catch {
              // malformed frame — skip
            }
          } else if (line.trim()) {
            this.emitOutput(cb, line, 'stdout')
          }
        },
        onStderr: (line) => {
          // Filter V8 inspector noise from the tracer's child process.
          if (
            line.includes('ws://') ||
            line.includes('Debugger listening') ||
            line.includes('Debugger attached') ||
            line.includes('For help, see') ||
            line.includes('Waiting for the debugger') ||
            line.includes('Inspector WS error')
          )
            return
          if (line.trim()) this.emitOutput(cb, line, 'stderr')
        },
        onExit: (code) => {
          try {
            fs.unlinkSync(tmpFile)
          } catch {}
          this.emitComplete(cb, code, frames.length)
          resolve()
        },
        onError: (err) => {
          this.emitError(cb, err.message, 'runtime')
          resolve()
        },
        timeoutMs: 10_000,
      })
    })
  }
}
