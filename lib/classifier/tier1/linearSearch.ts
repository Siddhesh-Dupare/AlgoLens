import type { Matcher } from './helpers'
import { getNumericVar, proportion } from './helpers'

export type { MatcherResult } from './helpers'

export const matchLinearSearch: Matcher = (frames) => {
  if (frames.length < 3)
    return { algorithmClass: 'linear_search', score: 0, evidence: [] }

  const evidence: string[] = []
  let score = 0

  const indexNames = ['i', 'idx', 'index', 'cur', 'pos', 'j']
  let indexIncrementCount = 0
  let prevIndexVal: number | null = null

  for (let f = 1; f < frames.length; f++) {
    const cur = getNumericVar(frames[f], indexNames)
    if (cur !== null && prevIndexVal !== null) {
      if (cur - prevIndexVal === 1) indexIncrementCount++
    }
    if (cur !== null) prevIndexVal = cur
  }

  const indexProportion = proportion(indexIncrementCount, frames.length - 1)
  if (indexProportion > 0.5) {
    score += 0.4
    evidence.push(
      `index increments by 1 in ${Math.round(indexProportion * 100)}% of steps`
    )
  }

  const keyNames = ['key', 'target', 'val', 'value', 'x', 'search']
  let keyVar: string | null = null
  let keyValue: string | null = null
  let keyConstantCount = 0

  for (const name of keyNames) {
    if (frames[0]?.variables[name]) {
      keyVar = name
      keyValue = frames[0].variables[name].value
      break
    }
  }

  if (keyVar && keyValue) {
    for (const frame of frames) {
      if (frame.variables[keyVar]?.value === keyValue) keyConstantCount++
    }
    const keyProp = proportion(keyConstantCount, frames.length)
    if (keyProp > 0.8) {
      score += 0.4
      evidence.push(`key variable "${keyVar}" remains constant`)
    }
  }

  const compareFrames = frames.filter(
    (f) => f.stepType === 'compare' || f.stepType === 'line'
  ).length
  if (proportion(compareFrames, frames.length) > 0.3) {
    score += 0.2
    evidence.push('comparison operations present')
  }

  return { algorithmClass: 'linear_search', score: Math.min(score, 1), evidence }
}
