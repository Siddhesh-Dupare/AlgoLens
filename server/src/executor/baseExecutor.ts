import { ProcessManager } from '../sandbox/processManager'
import { RuntimePaths } from '../utils/pathResolver'
import {
  RunRequest,
  DebugRequest,
  ServerMessage,
  ExecutionError,
} from '../types'

export type MessageCallback = (msg: ServerMessage) => void

export abstract class BaseExecutor {
  protected pm: ProcessManager
  protected runtimes: RuntimePaths
  protected requestId: string = ''
  protected startTime: number = 0

  constructor(pm: ProcessManager, runtimes: RuntimePaths) {
    this.pm = pm
    this.runtimes = runtimes
  }

  abstract run(req: RunRequest, cb: MessageCallback): Promise<void>
  abstract debug(req: DebugRequest, cb: MessageCallback): Promise<void>

  stop(): void {
    this.pm.kill(this.requestId)
  }

  protected emit(cb: MessageCallback, msg: ServerMessage): void {
    cb(msg)
  }

  protected emitOutput(
    cb: MessageCallback,
    text: string,
    stream: 'stdout' | 'stderr' = 'stdout'
  ): void {
    cb({
      type: 'output',
      id: this.requestId,
      stream,
      text,
      timestamp: Date.now(),
    })
  }

  protected emitComplete(
    cb: MessageCallback,
    exitCode: number,
    totalFrames?: number
  ): void {
    cb({
      type: 'complete',
      id: this.requestId,
      exitCode,
      totalFrames,
      durationMs: Date.now() - this.startTime,
    })
  }

  protected emitError(
    cb: MessageCallback,
    message: string,
    errorType: ExecutionError['errorType']
  ): void {
    cb({
      type: 'error',
      id: this.requestId,
      message,
      errorType,
    })
  }
}
