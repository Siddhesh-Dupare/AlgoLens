import type {
  TraceFrame,
  GraphVisualIR,
  GraphNode,
  GraphEdge,
  AlgorithmClass,
  DetectionTier,
  NodeState,
} from '../types'

function parseGraph(value: string): Record<string, string[]> | null {
  try {
    const json = value
      .replace(/'/g, '"')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
    const parsed = JSON.parse(json)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string[]>
    }
    return null
  } catch {
    return null
  }
}

export function emitGraph(
  frames: TraceFrame[],
  algorithmClass: AlgorithmClass,
  confidence: number,
  tier: DetectionTier
): GraphVisualIR[] {
  let graphStructure: Record<string, string[]> = {}

  for (const frame of frames) {
    for (const [, varData] of Object.entries(frame.variables)) {
      if (varData.type === 'dict') {
        const parsed = parseGraph(varData.value)
        if (parsed && Object.keys(parsed).length > 0) {
          graphStructure = parsed
          break
        }
      }
    }
    if (Object.keys(graphStructure).length > 0) break
  }

  const allNodes = new Set<string>()
  const edgeSet: Array<[string, string]> = []
  for (const [node, neighbors] of Object.entries(graphStructure)) {
    allNodes.add(node)
    if (Array.isArray(neighbors)) {
      for (const neighbor of neighbors) {
        allNodes.add(String(neighbor))
        edgeSet.push([node, String(neighbor)])
      }
    }
  }

  const nodeArray = Array.from(allNodes)
  const nodePositions: Record<string, { x: number; y: number }> = {}
  nodeArray.forEach((n, i) => {
    const angle = (i / Math.max(nodeArray.length, 1)) * 2 * Math.PI
    nodePositions[n] = {
      x: Math.round(300 + 200 * Math.cos(angle)),
      y: Math.round(200 + 150 * Math.sin(angle)),
    }
  })

  return frames.map((frame, idx) => {
    const visitedVar = frame.variables['visited'] ?? frame.variables['seen']
    const queueVar = frame.variables['queue'] ?? frame.variables['q']
    const currentVar =
      frame.variables['node'] ??
      frame.variables['current'] ??
      frame.variables['vertex']

    let visited: string[] = []
    let queue: string[] = []
    let current: string | null = null

    try {
      if (visitedVar) {
        const v = visitedVar.value
          .replace(/set\(\[|\]\)/g, '[')
          .replace(/set\(\)/g, '[]')
          .replace(/'/g, '"')
        const parsed = JSON.parse(v)
        if (Array.isArray(parsed)) visited = parsed.map(String)
      }
    } catch {
      // ignore
    }

    try {
      if (queueVar) {
        const q = queueVar.value
          .replace(/deque\(\[|\]\)/g, '[')
          .replace(/'/g, '"')
        const parsed = JSON.parse(q)
        if (Array.isArray(parsed)) queue = parsed.map(String)
      }
    } catch {
      // ignore
    }

    if (currentVar) current = currentVar.value.replace(/'/g, '')

    const nodes: GraphNode[] = nodeArray.map((n) => ({
      id: n,
      label: n,
      state: (n === current
        ? 'current'
        : visited.includes(n)
          ? 'visited'
          : queue.includes(n)
            ? 'queued'
            : 'default') as NodeState,
      x: nodePositions[n].x,
      y: nodePositions[n].y,
    }))

    const edges: GraphEdge[] = edgeSet.map(([s, t]) => ({
      source: s,
      target: t,
      directed: false,
      state:
        visited.includes(s) && visited.includes(t) ? 'traversed' : 'default',
    }))

    return {
      frameIndex: idx,
      lineNumber: frame.lineNumber,
      algorithmClass,
      dataStructure: 'graph',
      stepType: frame.stepType,
      tier,
      confidence,
      narration: current
        ? `${algorithmClass === 'bfs' ? 'BFS' : 'DFS'}: visiting node ${current}. Visited: ${
            visited.join(', ') || 'none'
          }.`
        : `Line ${frame.lineNumber}: graph traversal step.`,
      nodes,
      edges,
      visitedOrder: visited,
      queue: algorithmClass === 'bfs' ? queue : undefined,
      stack: algorithmClass === 'dfs' ? queue : undefined,
    }
  })
}
