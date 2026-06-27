import { ProcessManager } from '../sandbox/processManager'
import { RuntimePaths } from '../utils/pathResolver'
import { createExecutor } from './index'
import {
  ComplexityRequest,
  ServerMessage,
  Language,
} from '../types'

type Send = (msg: ServerMessage) => void

// Replace the LAST array-literal assignment (`data = [..]`, `const arr = [..]`)
// with a generated random array of size n, so the program's existing main runs
// against size n. Returns null if no array literal is found.
function injectArray(code: string, language: Language, n: number): string | null {
  const arrRe = /=\s*\[[^\]]*\]/g
  let last: RegExpExecArray | null = null
  let m: RegExpExecArray | null
  while ((m = arrRe.exec(code)) !== null) last = m
  if (!last) return null

  const gen =
    language === 'python'
      ? `= __import__('random').sample(range(1, ${n} * 10 + 1), ${n})`
      : `= Array.from({ length: ${n} }, () => Math.floor(Math.random() * ${n} * 10))`

  return code.slice(0, last.index) + gen + code.slice(last.index + last[0].length)
}

function extFor(language: Language): string {
  return language === 'python' ? 'py' : 'js'
}

export async function runComplexity(
  req: ComplexityRequest,
  pm: ProcessManager,
  runtimes: RuntimePaths,
  send: Send
): Promise<void> {
  // Phase 6 supports Python and JavaScript only.
  if (req.language !== 'python' && req.language !== 'javascript') {
    send({
      type: 'error',
      id: req.id,
      message: `Complexity analysis is not supported for ${req.language} yet.`,
      errorType: 'unsupported',
    })
    return
  }

  const measurements: ComplexityResultMeasurement[] = []

  for (let i = 0; i < req.inputSizes.length; i++) {
    const n = req.inputSizes[i]
    send({
      type: 'complexity-progress',
      id: req.id,
      n,
      index: i,
      total: req.inputSizes.length,
    })

    const injected = injectArray(req.code, req.language, n)
    if (injected === null) {
      send({
        type: 'error',
        id: req.id,
        message: 'Could not find an array literal to scale for complexity analysis.',
        errorType: 'runtime',
      })
      return
    }

    const executor = createExecutor(req.language, pm, runtimes)
    let frameCount = 0
    let totalFrames: number | undefined
    let completed = false
    const start = Date.now()

    try {
      await executor.debug(
        {
          type: 'debug',
          id: `${req.id}-n${n}`,
          language: req.language,
          code: injected,
          filename: `complexity.${extFor(req.language)}`,
        },
        (m: ServerMessage) => {
          if (m.type === 'frame') frameCount++
          else if (m.type === 'complete') {
            totalFrames = m.totalFrames
            completed = true
          }
        }
      )
    } catch {
      // A single failed size shouldn't abort the whole analysis.
    }

    // If this size didn't finish (trace/timeout ceiling for a quadratic run),
    // stop here rather than recording a truncated count that would flatten the
    // curve. The completed sizes already show the growth trend.
    if (!completed) break

    measurements.push({
      n,
      operations: totalFrames ?? frameCount,
      timeMs: Date.now() - start,
    })
  }

  send({ type: 'complexity-result', id: req.id, measurements })
}

type ComplexityResultMeasurement = {
  n: number
  operations: number
  timeMs: number
}
