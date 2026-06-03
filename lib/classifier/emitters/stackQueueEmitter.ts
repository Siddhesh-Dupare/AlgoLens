import type {
  TraceFrame,
  StackQueueVisualIR,
  StackFrame,
  AlgorithmClass,
  DetectionTier,
} from '../types'

function parseListLoose(value: string): (string | number)[] | null {
  try {
    const clean = value
      .replace(/deque\(\[|\]\)/g, '[')
      .replace(/'/g, '"')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
    const parsed = JSON.parse(clean)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function emitStackQueue(
  frames: TraceFrame[],
  algorithmClass: AlgorithmClass,
  confidence: number,
  tier: DetectionTier
): StackQueueVisualIR[] {
  const isStack = algorithmClass === 'stack'
  const ds: 'stack' | 'queue' = isStack ? 'stack' : 'queue'

  return frames.map((frame, idx) => {
    const v =
      frame.variables[isStack ? 'stack' : 'queue'] ??
      frame.variables['s'] ??
      frame.variables['q']
    const items = (v ? parseListLoose(v.value) : null) ?? []

    const sframes: StackFrame[] = items.map((val, i) => ({
      value: val,
      state: i === items.length - 1 ? 'current' : 'default',
      index: i,
    }))

    return {
      frameIndex: idx,
      lineNumber: frame.lineNumber,
      algorithmClass,
      dataStructure: ds,
      stepType: frame.stepType,
      tier,
      confidence,
      narration: `Line ${frame.lineNumber}: ${ds} has ${items.length} item(s).`,
      frames: sframes,
      topIndex: isStack ? items.length - 1 : undefined,
      frontIndex: !isStack ? 0 : undefined,
      rearIndex: !isStack ? items.length - 1 : undefined,
    }
  })
}
