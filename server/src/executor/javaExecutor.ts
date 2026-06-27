import { BaseExecutor, MessageCallback } from './baseExecutor'
import { RunRequest, DebugRequest, TraceFrame } from '../types'
import { ProcessManager } from '../sandbox/processManager'
import { RuntimePaths } from '../utils/pathResolver'
import { logger } from '../utils/logger'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

const FRAME_PREFIX = '__ALGOLENS_FRAME__:'

export class JavaExecutor extends BaseExecutor {
  private tracerClassDir = ''
  private tracerAvailable = false
  // Extra args needed at runtime to expose the JDI module (JDK 9+).
  private tracerModuleArgs: string[] = []

  constructor(pm: ProcessManager, runtimes: RuntimePaths) {
    super(pm, runtimes)
    this.compileJavaTracer()
  }

  private compileJavaTracer(): void {
    const tracerSrc = path.resolve(__dirname, '..', 'tracer', 'JavaTracer.java')
    const outDir = path.join(os.tmpdir(), 'algolens_jtracer')
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
    this.tracerClassDir = outDir

    const classFile = path.join(outDir, 'JavaTracer.class')
    if (fs.existsSync(classFile)) {
      this.tracerAvailable = true
      // Assume modern JDK runtime args; harmless if not needed.
      this.tracerModuleArgs = ['--add-modules', 'jdk.jdi']
      return
    }

    const javaHome = process.env.JAVA_HOME ?? ''
    const toolsJar = javaHome ? path.join(javaHome, 'lib', 'tools.jar') : ''
    const hasToolsJar = toolsJar && fs.existsSync(toolsJar)

    // Strategy 1: legacy JDK 8 with tools.jar on the classpath.
    if (hasToolsJar) {
      try {
        execSync(
          `"${this.runtimes.javac}" -cp "${toolsJar}" -d "${outDir}" "${tracerSrc}"`,
          { timeout: 30_000, stdio: 'ignore' }
        )
        this.tracerAvailable = true
        this.tracerModuleArgs = []
        logger.info('[JavaExecutor] JavaTracer compiled (tools.jar).')
        return
      } catch {
        // fall through
      }
    }

    // Strategy 2: modern JDK 9+ via the jdk.jdi module.
    try {
      execSync(
        `"${this.runtimes.javac}" --add-modules jdk.jdi -d "${outDir}" "${tracerSrc}"`,
        { timeout: 30_000, stdio: 'ignore' }
      )
      this.tracerAvailable = true
      this.tracerModuleArgs = ['--add-modules', 'jdk.jdi']
      logger.info('[JavaExecutor] JavaTracer compiled (jdk.jdi module).')
      return
    } catch (err) {
      logger.warn(
        '[JavaExecutor] Could not compile JavaTracer:',
        err instanceof Error ? err.message : String(err)
      )
      logger.warn('[JavaExecutor] Java debug will not be available.')
      this.tracerAvailable = false
    }
  }

  private extractClassName(code: string): string | null {
    const match = code.match(/public\s+class\s+(\w+)/)
    return match?.[1] ?? null
  }

  private compileJava(
    id: string,
    srcFile: string,
    outDir: string,
    cb: MessageCallback
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.pm.spawn(id + '_compile', {
        cmd: this.runtimes.javac,
        args: ['-g', '-d', outDir, srcFile],
        cwd: outDir,
        onStdout: () => {},
        onStderr: (line) => {
          if (line.trim()) this.emitOutput(cb, line, 'stderr')
        },
        onExit: (code) => {
          if (code !== 0) {
            this.emitError(cb, 'Java compilation failed.', 'compile')
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

    const className = this.extractClassName(req.code) ?? 'Main'
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), `algolens_java_${req.id}_`))
    const src = path.join(workDir, `${className}.java`)
    fs.writeFileSync(src, req.code, 'utf8')

    const cleanup = () => {
      try {
        fs.rmSync(workDir, { recursive: true, force: true })
      } catch {}
    }

    logger.info(`Compiling Java: ${this.runtimes.javac} ${src}`)
    const compiled = await this.compileJava(req.id, src, workDir, cb)
    if (!compiled) {
      cleanup()
      this.emitComplete(cb, 1)
      return
    }

    await new Promise<void>((resolve) => {
      this.pm.spawn(req.id + '_run', {
        cmd: this.runtimes.java,
        args: ['-cp', workDir, className],
        cwd: workDir,
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

  // ── DEBUG (JavaTracer via JDI) ───────────────────────────
  async debug(req: DebugRequest, cb: MessageCallback): Promise<void> {
    this.requestId = req.id
    this.startTime = Date.now()

    const className = this.extractClassName(req.code)
    if (!className) {
      this.emitError(cb, 'Could not find public class name in Java code.', 'compile')
      this.emitComplete(cb, 1)
      return
    }

    if (!this.tracerAvailable) {
      this.emitOutput(
        cb,
        '[AlgoLens] Java debug not available (JavaTracer compilation failed).',
        'stderr'
      )
      this.emitOutput(
        cb,
        '[AlgoLens] Ensure JAVA_HOME points to a JDK (not a JRE).',
        'stderr'
      )
      this.emitComplete(cb, 0)
      return
    }

    const workDir = fs.mkdtempSync(
      path.join(os.tmpdir(), `algolens_javadbg_${req.id}_`)
    )
    const src = path.join(workDir, `${className}.java`)
    fs.writeFileSync(src, req.code, 'utf8')

    const cleanup = () => {
      try {
        fs.rmSync(workDir, { recursive: true, force: true })
      } catch {}
    }

    const compiled = await this.compileJava(req.id, src, workDir, cb)
    if (!compiled) {
      cleanup()
      this.emitComplete(cb, 1)
      return
    }

    const frames: TraceFrame[] = []
    let frameIndex = 0

    return new Promise((resolve) => {
      this.pm.spawn(req.id, {
        cmd: this.runtimes.java,
        args: [
          ...this.tracerModuleArgs,
          '-cp',
          this.tracerClassDir,
          'JavaTracer',
          workDir,
          className,
          src,
        ],
        cwd: workDir,
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
          if (line.trim()) this.emitOutput(cb, line, 'stderr')
        },
        onExit: (code) => {
          cleanup()
          this.emitComplete(cb, code, frames.length)
          resolve()
        },
        onError: (err) => {
          cleanup()
          this.emitError(cb, err.message, 'runtime')
          resolve()
        },
        timeoutMs: 12_000,
      })
    })
  }
}
