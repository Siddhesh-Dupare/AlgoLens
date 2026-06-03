import type { TraceFrame, AlgorithmClass } from '../types'

export interface MatcherResult {
  algorithmClass: AlgorithmClass
  score: number
  evidence: string[]
}

export type Matcher = (frames: TraceFrame[]) => MatcherResult

export function getNumericVar(
  frame: TraceFrame,
  names: string[]
): number | null {
  for (const name of names) {
    const v = frame.variables[name]
    if (v) {
      const parsed = parseFloat(v.value)
      if (!Number.isNaN(parsed)) return parsed
    }
  }
  return null
}

export function parseArrayValue(value: string): number[] | null {
  try {
    const clean = value
      .replace(/'/g, '"')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
    const parsed = JSON.parse(clean)
    if (Array.isArray(parsed)) return parsed.map((x) => Number(x))
    return null
  } catch {
    return null
  }
}

export function getArrayVar(
  frame: TraceFrame,
  names: string[]
): number[] | null {
  for (const name of names) {
    const v = frame.variables[name]
    if (!v) continue
    const arr = parseArrayValue(v.value)
    if (arr) return arr
  }
  return null
}

export function proportion(matching: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(1, Math.max(0, matching / total))
}
