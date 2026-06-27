import { BaseExecutor, MessageCallback } from './baseExecutor'
import { RunRequest, DebugRequest, TraceFrame } from '../types'
import fs from 'fs'
import path from 'path'
import os from 'os'

const FRAME_PREFIX = '__ALGOLENS_FRAME__:'

export class PythonExecutor extends BaseExecutor {
  async run(req: RunRequest, cb: MessageCallback): Promise<void> {
    this.requestId = req.id
    this.startTime = Date.now()

    const tmpDir = os.tmpdir()
    const tmpFile = path.join(tmpDir, `algolens_${req.id}.py`)
    fs.writeFileSync(tmpFile, req.code, 'utf8')

    return new Promise((resolve) => {
      this.pm.spawn(req.id, {
        cmd: this.runtimes.python,
        args: ['-u', tmpFile],
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
    const tracerPath = path.resolve(__dirname, '..', 'tracer', 'pythonTracer.py')
    const tracerCode = fs.readFileSync(tracerPath, 'utf8')

    const prefix = tracerCode + '\n\n'
    // Number of injected lines before the user's code begins; subtract this from
    // every reported line number so the editor arrow maps to the user's source.
    const lineOffset = prefix.split('\n').length - 1
    const injectedCode = prefix + req.code
    const tmpFile = path.join(tmpDir, `algolens_debug_${req.id}.py`)
    fs.writeFileSync(tmpFile, injectedCode, 'utf8')

    const frames: TraceFrame[] = []
    let frameIndex = 0

    return new Promise((resolve) => {
      this.pm.spawn(req.id, {
        cmd: this.runtimes.python,
        args: ['-u', tmpFile],
        cwd: tmpDir,
        onStdout: (line) => {
          if (line.startsWith(FRAME_PREFIX)) {
            try {
              const raw = JSON.parse(line.slice(FRAME_PREFIX.length))
              const adjustedLine = Math.max(1, (raw.lineNumber ?? 1) - lineOffset)
              const callStack = Array.isArray(raw.callStack)
                ? raw.callStack.map((cf: { lineNumber: number }) => ({
                    ...cf,
                    lineNumber: Math.max(1, cf.lineNumber - lineOffset),
                  }))
                : []
              const frame: TraceFrame = {
                ...raw,
                lineNumber: adjustedLine,
                callStack,
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
