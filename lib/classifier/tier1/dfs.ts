import type { Matcher } from './helpers'

export const matchDFS: Matcher = (frames) => {
  if (frames.length < 3) return { algorithmClass: 'dfs', score: 0, evidence: [] }

  const evidence: string[] = []
  let score = 0

  let maxDepth = 0
  let hasBacktracking = false

  for (let f = 1; f < frames.length; f++) {
    const currDepth = frames[f].callStack.length
    const prevDepth = frames[f - 1].callStack.length
    if (currDepth > maxDepth) maxDepth = currDepth
    if (currDepth < prevDepth) hasBacktracking = true
  }

  if (maxDepth > 2) {
    score += 0.4
    evidence.push(`recursion depth ${maxDepth} detected`)
  }
  if (hasBacktracking) {
    score += 0.3
    evidence.push('backtracking in call stack detected')
  }

  const stackNames = ['stack', 's', 'dfs_stack']
  const hasStack = frames.some((f) =>
    stackNames.some((n) => f.variables[n] !== undefined)
  )
  if (hasStack) {
    score += 0.3
    evidence.push('stack data structure detected')
  }

  const hasVisited = frames.some((f) =>
    ['visited', 'seen'].some((n) => f.variables[n] !== undefined)
  )
  if (hasVisited) {
    score += 0.2
    evidence.push('visited set detected')
  }

  return { algorithmClass: 'dfs', score: Math.min(score, 1), evidence }
}
