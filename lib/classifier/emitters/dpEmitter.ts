import type {
  TraceFrame,
  DPVisualIR,
  DPCell,
  AlgorithmClass,
  DetectionTier,
} from '../types'

function parse2D(value: string): number[][] | null {
  try {
    const clean = value
      .replace(/'/g, '"')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed) && parsed.every((r) => Array.isArray(r))) {
      return parsed as number[][]
    }
    return null
  } catch {
    return null
  }
}

const DP_NAMES = ['dp', 'table', 'memo', 'grid', 'matrix']

// Stub — finds a 2D array (dp table) in the trace and renders it flat.
export function emitDP(
  frames: TraceFrame[],
  algorithmClass: AlgorithmClass,
  confidence: number,
  tier: DetectionTier
): DPVisualIR[] {
  return frames.map((frame, idx) => {
    let table: number[][] | null = null
    for (const n of DP_NAMES) {
      const v = frame.variables[n]
      if (v) {
        table = parse2D(v.value)
        if (table) break
      }
    }

    const rows = table?.length ?? 0
    const cols = table?.[0]?.length ?? 0
    const cells: DPCell[] = []
    if (table) {
      table.forEach((row, r) =>
        row.forEach((val, c) =>
          cells.push({ row: r, col: c, value: val, state: 'default' })
        )
      )
    }

    return {
      frameIndex: idx,
      lineNumber: frame.lineNumber,
      algorithmClass,
      dataStructure: 'dp_table',
      stepType: frame.stepType,
      tier,
      confidence,
      narration: `Line ${frame.lineNumber}: DP table ${rows}x${cols}.`,
      cells,
      rows,
      cols,
    }
  })
}
