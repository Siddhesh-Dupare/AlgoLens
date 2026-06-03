import type { Matcher } from './helpers'
import { getNumericVar } from './helpers'

export const matchBinarySearch: Matcher = (frames) => {
  if (frames.length < 3)
    return { algorithmClass: 'binary_search', score: 0, evidence: [] }

  const evidence: string[] = []
  let score = 0

  const hasLow = frames.some(
    (f) => f.variables['low'] || f.variables['left'] || f.variables['lo']
  )
  const hasHigh = frames.some(
    (f) => f.variables['high'] || f.variables['right'] || f.variables['hi']
  )
  const hasMid = frames.some(
    (f) => f.variables['mid'] || f.variables['middle']
  )

  if (hasLow && hasHigh) {
    score += 0.35
    evidence.push('low/high bounds present')
  }
  if (hasMid) {
    score += 0.35
    evidence.push('mid variable present')
  }

  const indexNames = ['mid', 'middle', 'i']
  let nonLinearJumps = 0
  let prevIdx: number | null = null

  for (const frame of frames) {
    const idx = getNumericVar(frame, indexNames)
    if (idx !== null && prevIdx !== null) {
      const diff = Math.abs(idx - prevIdx)
      if (diff !== 1 && diff !== 0) nonLinearJumps++
    }
    if (idx !== null) prevIdx = idx
  }

  if (nonLinearJumps > 2) {
    score += 0.3
    evidence.push('non-linear index jumps detected (halving behavior)')
  }

  return { algorithmClass: 'binary_search', score: Math.min(score, 1), evidence }
}
