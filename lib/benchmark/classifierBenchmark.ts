import { classify } from '@/lib/classifier'
import { executionClient } from '@/lib/executionClient'
import type { AlgorithmClass } from '@/lib/classifier/types'

// B1 — Classifier benchmark. Runs each hardcoded Python implementation through
// the FULL pipeline (execute → trace → Tier 1 fingerprint + Tier 2 name/static
// + Tier 3 LLM) and measures precision / latency / per-tier hit rate. The
// numbers feed TABLE I of the paper.

export interface BenchmarkCase {
  name: string
  expected: AlgorithmClass
  code: string
}

export interface CaseResult {
  name: string
  expected: string
  detected: string
  tier: number
  confidence: number
  correct: boolean
  latencyMs: number
  error?: string
}

export interface AlgorithmStats {
  tested: number
  correct: number
  avgConfidence: number
  tier1Detections: number
  tier2Detections: number
  tier3Detections: number
}

export interface BenchmarkResults {
  totalTests: number
  correct: number
  precision: number
  byAlgorithm: Record<string, AlgorithmStats>
  avgLatencyMs: number
  tier1HitRate: number
  tier2HitRate: number
  tier3HitRate: number
  cases: CaseResult[]
}

// ── Test cases (runnable Python; each ends with a call so the tracer runs) ──

const LINEAR_SEARCH_CASES: BenchmarkCase[] = [
  {
    name: 'linear_search: standard for loop',
    expected: 'linear_search',
    code: `def linear_search(arr, key):
    for i in range(len(arr)):
        if arr[i] == key:
            return i
    return -1

print(linear_search([4, 2, 7, 1, 9, 3], 9))
`,
  },
  {
    name: 'linear_search: while loop',
    expected: 'linear_search',
    code: `def linear_search(arr, key):
    i = 0
    while i < len(arr):
        if arr[i] == key:
            return i
        i += 1
    return -1

print(linear_search([10, 20, 30, 40], 30))
`,
  },
  {
    name: 'linear_search: enumerate',
    expected: 'linear_search',
    code: `def linear_search(arr, key):
    for idx, val in enumerate(arr):
        if val == key:
            return idx
    return -1

print(linear_search([5, 8, 1, 3, 7], 3))
`,
  },
  {
    name: 'linear_search: early return',
    expected: 'linear_search',
    code: `def search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1

print(search([2, 4, 6, 8, 10], 8))
`,
  },
  {
    name: "linear_search: named 'find_element'",
    expected: 'linear_search',
    code: `def find_element(data, value):
    for i in range(len(data)):
        if data[i] == value:
            return i
    return -1

print(find_element([3, 1, 4, 1, 5, 9], 4))
`,
  },
]

const BUBBLE_SORT_CASES: BenchmarkCase[] = [
  {
    name: 'bubble_sort: standard',
    expected: 'bubble_sort',
    code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

print(bubble_sort([64, 34, 25, 12, 22, 11]))
`,
  },
  {
    name: 'bubble_sort: swapped flag',
    expected: 'bubble_sort',
    code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr

print(bubble_sort([5, 1, 4, 2, 8]))
`,
  },
  {
    name: "bubble_sort: named 'sort_array'",
    expected: 'bubble_sort',
    code: `def sort_array(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

print(sort_array([9, 7, 5, 3, 1]))
`,
  },
  {
    name: 'bubble_sort: descending',
    expected: 'bubble_sort',
    code: `def bubble_sort_desc(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] < arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

print(bubble_sort_desc([3, 1, 4, 1, 5, 9]))
`,
  },
  {
    name: "bubble_sort: named 'my_sort'",
    expected: 'bubble_sort',
    code: `def my_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

print(my_sort([2, 5, 1, 8, 3]))
`,
  },
]

const BINARY_SEARCH_CASES: BenchmarkCase[] = [
  {
    name: 'binary_search: iterative',
    expected: 'binary_search',
    code: `def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

print(binary_search([10, 20, 30, 40, 50, 60], 30))
`,
  },
  {
    name: 'binary_search: recursive',
    expected: 'binary_search',
    code: `def binary_search(arr, target, lo, hi):
    if lo > hi:
        return -1
    mid = (lo + hi) // 2
    if arr[mid] == target:
        return mid
    if arr[mid] < target:
        return binary_search(arr, target, mid + 1, hi)
    return binary_search(arr, target, lo, mid - 1)

print(binary_search([1, 3, 5, 7, 9, 11], 7, 0, 5))
`,
  },
  {
    name: "binary_search: named 'bsearch'",
    expected: 'binary_search',
    code: `def bsearch(arr, key):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == key:
            return mid
        elif arr[mid] < key:
            low = mid + 1
        else:
            high = mid - 1
    return -1

print(bsearch([2, 4, 6, 8, 10, 12, 14], 10))
`,
  },
  {
    name: 'binary_search: midpoint variant',
    expected: 'binary_search',
    code: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if arr[mid] == target:
            return mid
        if arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

print(binary_search([5, 10, 15, 20, 25, 30], 25))
`,
  },
  {
    name: "binary_search: named 'find_sorted'",
    expected: 'binary_search',
    code: `def find_sorted(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

print(find_sorted([1, 2, 3, 4, 5, 6, 7, 8], 6))
`,
  },
]

const BFS_CASES: BenchmarkCase[] = [
  {
    name: 'bfs: deque queue',
    expected: 'bfs',
    code: `from collections import deque

def bfs(graph, start):
    visited = []
    queue = deque([start])
    seen = {start}
    while queue:
        node = queue.popleft()
        visited.append(node)
        for nb in graph[node]:
            if nb not in seen:
                seen.add(nb)
                queue.append(nb)
    return visited

g = {'A': ['B', 'C'], 'B': ['D'], 'C': ['D', 'E'], 'D': [], 'E': []}
print(bfs(g, 'A'))
`,
  },
  {
    name: 'bfs: list as queue',
    expected: 'bfs',
    code: `def bfs(graph, start):
    visited = []
    queue = [start]
    seen = {start}
    while queue:
        node = queue.pop(0)
        visited.append(node)
        for nb in graph[node]:
            if nb not in seen:
                seen.add(nb)
                queue.append(nb)
    return visited

g = {1: [2, 3], 2: [4], 3: [4, 5], 4: [], 5: []}
print(bfs(g, 1))
`,
  },
  {
    name: "bfs: named 'breadth_first'",
    expected: 'bfs',
    code: `from collections import deque

def breadth_first(graph, source):
    order = []
    q = deque([source])
    visited = {source}
    while q:
        cur = q.popleft()
        order.append(cur)
        for n in graph[cur]:
            if n not in visited:
                visited.add(n)
                q.append(n)
    return order

g = {'A': ['B', 'C'], 'B': ['D', 'E'], 'C': ['F'], 'D': [], 'E': [], 'F': []}
print(breadth_first(g, 'A'))
`,
  },
  {
    name: 'bfs: graph.get variant',
    expected: 'bfs',
    code: `from collections import deque

def bfs(graph, start):
    result = []
    visited = set([start])
    queue = deque([start])
    while queue:
        v = queue.popleft()
        result.append(v)
        for w in graph.get(v, []):
            if w not in visited:
                visited.add(w)
                queue.append(w)
    return result

g = {0: [1, 2], 1: [3], 2: [3, 4], 3: [5], 4: [5], 5: []}
print(bfs(g, 0))
`,
  },
  {
    name: "bfs: named 'traverse_graph'",
    expected: 'bfs',
    code: `from collections import deque

def traverse_graph(adj, start):
    visited = []
    seen = {start}
    dq = deque([start])
    while dq:
        node = dq.popleft()
        visited.append(node)
        for nb in adj[node]:
            if nb not in seen:
                seen.add(nb)
                dq.append(nb)
    return visited

g = {'A': ['B'], 'B': ['C', 'D'], 'C': [], 'D': ['E'], 'E': []}
print(traverse_graph(g, 'A'))
`,
  },
]

const DFS_CASES: BenchmarkCase[] = [
  {
    name: 'dfs: recursive',
    expected: 'dfs',
    code: `def dfs(graph, node, visited):
    visited.append(node)
    for nb in graph[node]:
        if nb not in visited:
            dfs(graph, nb, visited)
    return visited

g = {'A': ['B', 'C'], 'B': ['D'], 'C': ['D', 'E'], 'D': [], 'E': []}
print(dfs(g, 'A', []))
`,
  },
  {
    name: 'dfs: iterative stack',
    expected: 'dfs',
    code: `def dfs(graph, start):
    visited = []
    stack = [start]
    while stack:
        node = stack.pop()
        if node not in visited:
            visited.append(node)
            for nb in reversed(graph[node]):
                if nb not in visited:
                    stack.append(nb)
    return visited

g = {1: [2, 3], 2: [4], 3: [4, 5], 4: [], 5: []}
print(dfs(g, 1))
`,
  },
  {
    name: "dfs: named 'depth_first'",
    expected: 'dfs',
    code: `def depth_first(graph, node, seen=None):
    if seen is None:
        seen = []
    seen.append(node)
    for nb in graph[node]:
        if nb not in seen:
            depth_first(graph, nb, seen)
    return seen

g = {'A': ['B', 'C'], 'B': ['D', 'E'], 'C': ['F'], 'D': [], 'E': [], 'F': []}
print(depth_first(g, 'A'))
`,
  },
  {
    name: 'dfs: recursive with visited set',
    expected: 'dfs',
    code: `order = []

def dfs(graph, start, visited):
    visited.add(start)
    order.append(start)
    for nb in graph[start]:
        if nb not in visited:
            dfs(graph, nb, visited)

g = {0: [1, 2], 1: [3], 2: [3, 4], 3: [], 4: []}
dfs(g, 0, set())
print(order)
`,
  },
  {
    name: "dfs: named 'explore'",
    expected: 'dfs',
    code: `def explore(graph, node, visited):
    visited.append(node)
    for nb in graph[node]:
        if nb not in visited:
            explore(graph, nb, visited)
    return visited

g = {'A': ['B'], 'B': ['C', 'D'], 'C': [], 'D': ['E'], 'E': []}
print(explore(g, 'A', []))
`,
  },
]

export const BENCHMARK_CASES: BenchmarkCase[] = [
  ...LINEAR_SEARCH_CASES,
  ...BUBBLE_SORT_CASES,
  ...BINARY_SEARCH_CASES,
  ...BFS_CASES,
  ...DFS_CASES,
]

export interface RunBenchmarkOptions {
  apiKey?: string
  onProgress?: (done: number, total: number, name: string) => void
}

export async function runBenchmark(
  opts: RunBenchmarkOptions = {}
): Promise<BenchmarkResults> {
  if (!executionClient.isConnected()) {
    throw new Error(
      'Execution server not connected — start it and try again (the benchmark runs each case).'
    )
  }

  const cases = BENCHMARK_CASES
  const results: CaseResult[] = []

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i]
    opts.onProgress?.(i, cases.length, c.name)
    try {
      const frames = await executionClient.traceOnce('python', c.code, 'bench.py')
      const t0 = performance.now()
      const out = await classify(frames, c.code, {
        language: 'python',
        apiKey: opts.apiKey,
      })
      const latencyMs = performance.now() - t0
      const detected = out.classification.algorithmClass
      results.push({
        name: c.name,
        expected: c.expected,
        detected,
        tier: out.classification.tier,
        confidence: out.classification.confidence,
        correct: detected === c.expected,
        latencyMs,
      })
    } catch (err) {
      results.push({
        name: c.name,
        expected: c.expected,
        detected: 'error',
        tier: 0,
        confidence: 0,
        correct: false,
        latencyMs: 0,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }
  opts.onProgress?.(cases.length, cases.length, 'done')

  return aggregate(results)
}

function aggregate(cases: CaseResult[]): BenchmarkResults {
  const total = cases.length
  const correct = cases.filter((c) => c.correct).length
  const byAlgorithm: Record<string, AlgorithmStats> = {}

  for (const c of cases) {
    const a = (byAlgorithm[c.expected] ??= {
      tested: 0,
      correct: 0,
      avgConfidence: 0,
      tier1Detections: 0,
      tier2Detections: 0,
      tier3Detections: 0,
    })
    a.tested++
    if (c.correct) a.correct++
    a.avgConfidence += c.confidence
    if (c.tier === 1) a.tier1Detections++
    else if (c.tier === 2) a.tier2Detections++
    else if (c.tier === 3) a.tier3Detections++
  }
  for (const a of Object.values(byAlgorithm)) {
    a.avgConfidence = a.tested ? a.avgConfidence / a.tested : 0
  }

  const totalLatency = cases.reduce((s, c) => s + c.latencyMs, 0)
  const tierCount = (t: number) => cases.filter((c) => c.tier === t).length

  return {
    totalTests: total,
    correct,
    precision: total ? correct / total : 0,
    byAlgorithm,
    avgLatencyMs: total ? totalLatency / total : 0,
    tier1HitRate: total ? tierCount(1) / total : 0,
    tier2HitRate: total ? tierCount(2) / total : 0,
    tier3HitRate: total ? tierCount(3) / total : 0,
    cases,
  }
}

export function resultsToCSV(r: BenchmarkResults): string {
  const rows: string[] = [
    'Algorithm,Tested,Correct,Precision,AvgConfidence,Tier1,Tier2,Tier3',
  ]
  for (const [algo, s] of Object.entries(r.byAlgorithm)) {
    rows.push(
      [
        algo,
        s.tested,
        s.correct,
        (s.correct / s.tested).toFixed(3),
        s.avgConfidence.toFixed(3),
        s.tier1Detections,
        s.tier2Detections,
        s.tier3Detections,
      ].join(',')
    )
  }
  rows.push('')
  rows.push(
    [
      'OVERALL',
      r.totalTests,
      r.correct,
      r.precision.toFixed(3),
      '',
      '',
      '',
      '',
    ].join(',')
  )
  rows.push(`AvgLatencyMs,${r.avgLatencyMs.toFixed(1)}`)
  rows.push(`Tier1HitRate,${r.tier1HitRate.toFixed(3)}`)
  rows.push(`Tier2HitRate,${r.tier2HitRate.toFixed(3)}`)
  rows.push(`Tier3HitRate,${r.tier3HitRate.toFixed(3)}`)
  return rows.join('\n')
}
