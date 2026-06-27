import WebSocket, { WebSocketServer } from 'ws'
import { execSync } from 'child_process'
import { resolveRuntimes, RuntimePaths } from './utils/pathResolver'
import { ProcessManager } from './sandbox/processManager'
import { createExecutor } from './executor'
import { BaseExecutor } from './executor/baseExecutor'
import { runComplexity } from './executor/complexityRunner'
import { logger } from './utils/logger'
import {
  ClientMessage,
  ServerMessage,
  RuntimeStatus,
  RunRequest,
  DebugRequest,
  ComplexityRequest,
} from './types'

const PORT = 3001
const VERSION = '1.0.0'

const runtimes = resolveRuntimes()
const pm = new ProcessManager()

// Catch process-level errors so the server logs them instead of dying silently.
process.on('uncaughtException', (err) => {
  logger.error('[AlgoLens Server] Uncaught exception:', err)
})
process.on('unhandledRejection', (reason) => {
  logger.error('[AlgoLens Server] Unhandled rejection:', reason)
})

logger.info('[AlgoLens Server] Runtime paths resolved:')
logger.info('  Python:', runtimes.python)
logger.info('  Node:  ', runtimes.node)
logger.info('  GCC:   ', runtimes.gcc)
logger.info('  G++:   ', runtimes.gpp)
logger.info('  GDB:   ', runtimes.gdb)
logger.info('  Java:  ', runtimes.java)

function checkRuntimes(rt: RuntimePaths): RuntimeStatus['available'] {
  const checks: Array<{ name: string; path: string; test: string }> = [
    { name: 'Python', path: rt.python, test: '--version' },
    { name: 'Node.js', path: rt.node, test: '--version' },
    { name: 'GCC', path: rt.gcc, test: '--version' },
    { name: 'G++', path: rt.gpp, test: '--version' },
    { name: 'GDB', path: rt.gdb, test: '--version' },
    { name: 'Java', path: rt.java, test: '-version' },
    { name: 'JavaC', path: rt.javac, test: '-version' },
  ]
  const ok: Record<string, boolean> = {}
  for (const c of checks) {
    try {
      const ver = execSync(`"${c.path}" ${c.test} 2>&1`, { timeout: 5000 })
        .toString()
        .split('\n')[0]
        .trim()
      ok[c.name] = true
      logger.info(`  ✓ ${c.name}: ${ver}`)
    } catch {
      ok[c.name] = false
      logger.warn(`  ✗ ${c.name}: NOT FOUND at ${c.path}`)
    }
  }
  return {
    python: !!ok['Python'],
    javascript: !!ok['Node.js'],
    cpp: !!ok['G++'],
    c: !!ok['GCC'],
    java: !!ok['Java'] && !!ok['JavaC'],
  }
}

logger.info('[AlgoLens Server] Checking runtimes...')
const runtimeAvailable = checkRuntimes(runtimes)

const wss = new WebSocketServer({ port: PORT })

wss.on('listening', () => {
  logger.info(`[AlgoLens Server] Listening on ws://localhost:${PORT}`)
})

// Exit quietly if another instance already owns the port (common when the
// desktop shell relaunches and a previous server is still alive) — instead of
// crashing with an unhandled EADDRINUSE stack trace. The existing instance
// keeps serving, so the app still works.
wss.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    logger.warn(
      `[AlgoLens Server] Port ${PORT} already in use — another instance is running. Exiting.`
    )
    process.exit(0)
  }
  logger.error('[AlgoLens Server] WebSocket server error:', err)
  process.exit(1)
})

wss.on('connection', (ws: WebSocket) => {
  logger.info('[AlgoLens Server] Client connected')

  const activeExecutors = new Map<string, BaseExecutor>()

  const ready: ServerMessage = { type: 'ready', version: VERSION }
  ws.send(JSON.stringify(ready))

  const status: ServerMessage = {
    type: 'runtime-status',
    available: runtimeAvailable,
  }
  ws.send(JSON.stringify(status))

  const send = (serverMsg: ServerMessage) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(serverMsg))
    }
  }

  ws.on('message', async (rawData) => {
    let msg: ClientMessage
    try {
      msg = JSON.parse(rawData.toString()) as ClientMessage
    } catch {
      logger.error('[Server] Invalid JSON received')
      return
    }

    if (msg.type === 'run' || msg.type === 'debug') {
      logger.info(`[Server] ${msg.type} request: ${msg.language} id=${msg.id}`)
      const executor = createExecutor(msg.language, pm, runtimes)
      activeExecutors.set(msg.id, executor)
      try {
        if (msg.type === 'run') {
          await executor.run(msg as RunRequest, send)
        } else {
          await executor.debug(msg as DebugRequest, send)
        }
      } catch (err) {
        send({
          type: 'error',
          id: msg.id,
          message: err instanceof Error ? err.message : String(err),
          errorType: 'runtime',
        })
      } finally {
        activeExecutors.delete(msg.id)
      }
    } else if (msg.type === 'stop') {
      const executor = activeExecutors.get(msg.id)
      if (executor) {
        executor.stop()
        activeExecutors.delete(msg.id)
        logger.info(`[Server] Stopped ${msg.id}`)
      }
    } else if (msg.type === 'complexity') {
      logger.info(
        `[Server] complexity request: ${msg.language} id=${msg.id} sizes=${msg.inputSizes.join(',')}`
      )
      try {
        await runComplexity(msg as ComplexityRequest, pm, runtimes, send)
      } catch (err) {
        send({
          type: 'error',
          id: msg.id,
          message: err instanceof Error ? err.message : String(err),
          errorType: 'runtime',
        })
      }
    }
  })

  ws.on('close', () => {
    logger.info('[Server] Client disconnected — killing all processes')
    pm.killAll()
    activeExecutors.clear()
  })

  ws.on('error', (err) => {
    logger.error('[Server] WebSocket error:', err.message)
  })
})

process.on('SIGTERM', () => {
  pm.killAll()
  process.exit(0)
})
process.on('SIGINT', () => {
  pm.killAll()
  process.exit(0)
})
