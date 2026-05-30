import type { TraceFrame, GenericVisualIR, AlgorithmClass } from '../types'

function buildGenericNarration(frame: TraceFrame): string {
  const changed = Object.entries(frame.variables)
    .filter(([, v]) => v.changed)
    .map(([k, v]) => `${k} = ${v.value}`)

  if (changed.length === 0) return `Line ${frame.lineNumber}: executing.`
  return `Line ${frame.lineNumber}: ${changed.join(', ')}.`
}

export function emitGeneric(
  frames: TraceFrame[],
  algorithmClass: AlgorithmClass = 'generic',
  confidence = 0
): GenericVisualIR[] {
  return frames.map((frame, i) => ({
    frameIndex: i,
    lineNumber: frame.lineNumber,
    algorithmClass,
    dataStructure: 'generic',
    stepType: frame.stepType,
    tier: 0,
    confidence,
    narration: buildGenericNarration(frame),
    variables: Object.fromEntries(
      Object.entries(frame.variables).map(([k, v]) => [
        k,
        `${v.value} (${v.type})`,
      ])
    ),
    highlightedVars: Object.entries(frame.variables)
      .filter(([, v]) => v.changed)
      .map(([k]) => k),
  }))
}
