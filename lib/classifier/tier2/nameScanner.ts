import type { AlgorithmClass } from '../types'

export interface NameScanResult {
  algorithmClass: AlgorithmClass
  score: number
  matchedPattern: string
}

interface Pattern {
  pattern: RegExp
  algorithmClass: AlgorithmClass
  score: number
}

const PATTERNS: Pattern[] = [
  // High confidence
  { pattern: /bubble[_\s]?sort/i, algorithmClass: 'bubble_sort', score: 0.92 },
  { pattern: /linear[_\s]?search/i, algorithmClass: 'linear_search', score: 0.92 },
  { pattern: /binary[_\s]?search/i, algorithmClass: 'binary_search', score: 0.92 },
  { pattern: /selection[_\s]?sort/i, algorithmClass: 'selection_sort', score: 0.92 },
  { pattern: /insertion[_\s]?sort/i, algorithmClass: 'insertion_sort', score: 0.92 },
  { pattern: /merge[_\s]?sort/i, algorithmClass: 'merge_sort', score: 0.92 },
  { pattern: /quick[_\s]?sort/i, algorithmClass: 'quick_sort', score: 0.92 },
  { pattern: /\bbfs\b/i, algorithmClass: 'bfs', score: 0.92 },
  { pattern: /\bdfs\b/i, algorithmClass: 'dfs', score: 0.92 },
  { pattern: /breadth[_\s]?first/i, algorithmClass: 'bfs', score: 0.92 },
  { pattern: /depth[_\s]?first/i, algorithmClass: 'dfs', score: 0.92 },
  { pattern: /linked[_\s]?list/i, algorithmClass: 'linked_list', score: 0.92 },
  { pattern: /dijkstra/i, algorithmClass: 'bfs', score: 0.92 },
  { pattern: /\bdp\b|\bdynamic[_\s]?prog/i, algorithmClass: 'dynamic_programming', score: 0.92 },

  // Medium confidence
  { pattern: /\bsort\b/i, algorithmClass: 'bubble_sort', score: 0.72 },
  { pattern: /\bsearch\b/i, algorithmClass: 'linear_search', score: 0.72 },
  { pattern: /\bgraph\b/i, algorithmClass: 'bfs', score: 0.72 },
  { pattern: /\btree\b/i, algorithmClass: 'binary_tree', score: 0.72 },
  { pattern: /\bqueue\b/i, algorithmClass: 'queue', score: 0.72 },
  { pattern: /\bstack\b/i, algorithmClass: 'stack', score: 0.72 },
  { pattern: /hash[_\s]?map|hash[_\s]?table/i, algorithmClass: 'hashmap', score: 0.72 },

  // Low confidence
  { pattern: /traverse/i, algorithmClass: 'linked_list', score: 0.45 },
  { pattern: /\bvisit/i, algorithmClass: 'bfs', score: 0.45 },
  { pattern: /partition/i, algorithmClass: 'quick_sort', score: 0.45 },
  { pattern: /\bpivot\b/i, algorithmClass: 'quick_sort', score: 0.45 },
  { pattern: /\bmerge\b/i, algorithmClass: 'merge_sort', score: 0.45 },
  { pattern: /\bheap\b/i, algorithmClass: 'binary_tree', score: 0.45 },
]

export function scanNames(sourceCode: string): NameScanResult[] {
  const results: NameScanResult[] = []
  for (const { pattern, algorithmClass, score } of PATTERNS) {
    const m = sourceCode.match(pattern)
    if (m) {
      results.push({ algorithmClass, score, matchedPattern: m[0] })
    }
  }
  return results.sort((a, b) => b.score - a.score)
}
