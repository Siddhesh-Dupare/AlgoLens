import type { Matcher } from './helpers'

export const matchBFS: Matcher = (frames) => {
  if (frames.length < 3) return { algorithmClass: 'bfs', score: 0, evidence: [] }

  const evidence: string[] = []
  let score = 0

  const queueNames = ['queue', 'q', 'bfs_queue', 'deque']
  const hasQueue = frames.some((f) =>
    queueNames.some((n) => f.variables[n] !== undefined)
  )

  const visitedNames = ['visited', 'seen', 'explored']
  const hasVisited = frames.some((f) =>
    visitedNames.some((n) => f.variables[n] !== undefined)
  )

  const graphNames = ['graph', 'adj', 'neighbors', 'adjacency']
  const hasGraph = frames.some((f) =>
    graphNames.some((n) => f.variables[n] !== undefined)
  )

  if (hasQueue) {
    score += 0.4
    evidence.push('queue data structure detected')
  }
  if (hasVisited) {
    score += 0.3
    evidence.push('visited set detected')
  }
  if (hasGraph) {
    score += 0.3
    evidence.push('graph/adjacency structure detected')
  }

  return { algorithmClass: 'bfs', score: Math.min(score, 1), evidence }
}
