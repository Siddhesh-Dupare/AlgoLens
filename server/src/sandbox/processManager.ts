import { spawn, ChildProcess } from 'child_process'
import treeKill from 'tree-kill'
import { logger } from '../utils/logger'

export const MAX_CPU_MS = 10_000
export const MAX_RUN_MS = 15_000
export const MAX_BUFFER = 1024 * 1024 * 10

export interface SpawnOptions {
  cmd: string
  args: string[]
  cwd?: string
  env?: Record<string, string>
  onStdout: (line: string) => void
  onStderr: (line: string) => void
  onExit: (code: number) => void
  onError: (err: Error) => void
  timeoutMs?: number
}

export class ProcessManager {
  private processes: Map<string, ChildProcess> = new Map()

  spawn(id: string, options: SpawnOptions): void {
    const {
      cmd,
      args,
      cwd,
      env,
      onStdout,
      onStderr,
      onExit,
      onError,
      timeoutMs = MAX_RUN_MS,
    } = options

    let child: ChildProcess
    try {
      child = spawn(cmd, args, {
        cwd,
        env: { ...process.env, ...(env ?? {}) },
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)))
      return
    }

    this.processes.set(id, child)

    let finished = false
    const finish = (code: number) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      this.processes.delete(id)
      onExit(code)
    }

    const timer = setTimeout(() => {
      if (!finished) {
        logger.warn(`Process ${id} timed out after ${timeoutMs}ms — killing`)
        this.kill(id)
        finish(-1)
      }
    }, timeoutMs)

    const stripCr = (line: string) => line.replace(/\r$/, '')

    // ── stdout line buffering ──
    let outBuf = ''
    child.stdout?.setEncoding('utf8')
    child.stdout?.on('data', (chunk: string) => {
      outBuf += chunk
      const lines = outBuf.split('\n')
      outBuf = lines.pop() ?? ''
      for (const line of lines) onStdout(stripCr(line))
    })

    // ── stderr line buffering ──
    let errBuf = ''
    child.stderr?.setEncoding('utf8')
    child.stderr?.on('data', (chunk: string) => {
      errBuf += chunk
      const lines = errBuf.split('\n')
      errBuf = lines.pop() ?? ''
      for (const line of lines) onStderr(stripCr(line))
    })

    child.on('error', (err) => {
      onError(err)
      finish(-1)
    })

    child.on('close', (code) => {
      if (outBuf.length > 0) onStdout(stripCr(outBuf))
      if (errBuf.length > 0) onStderr(stripCr(errBuf))
      finish(code ?? 0)
    })
  }

  kill(id: string): void {
    const child = this.processes.get(id)
    if (!child) return
    const pid = child.pid
    if (pid !== undefined) {
      treeKill(pid, 'SIGKILL', (err) => {
        if (err) {
          try {
            child.kill('SIGKILL')
          } catch {
            // already gone
          }
        }
      })
    }
    this.processes.delete(id)
  }

  killAll(): void {
    for (const id of Array.from(this.processes.keys())) {
      this.kill(id)
    }
  }
}
