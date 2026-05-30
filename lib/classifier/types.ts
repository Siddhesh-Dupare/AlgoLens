// ── Input types ──────────────────────────────────────────────
export type { TraceFrame, TraceVariable } from '@/lib/executionTypes'

// ── Classification result ────────────────────────────────────

export type AlgorithmClass =
  | 'linear_search'
  | 'binary_search'
  | 'bubble_sort'
  | 'selection_sort'
  | 'insertion_sort'
  | 'merge_sort'
  | 'quick_sort'
  | 'bfs'
  | 'dfs'
  | 'linked_list'
  | 'stack'
  | 'queue'
  | 'dynamic_programming'
  | 'hashmap'
  | 'binary_tree'
  | 'generic'

export type DataStructure =
  | 'array'
  | 'linked_list'
  | 'tree'
  | 'graph'
  | 'stack'
  | 'queue'
  | 'hashmap'
  | 'dp_table'
  | 'generic'

export type DetectionTier = 1 | 2 | 3 | 0

export interface ClassificationResult {
  algorithmClass: AlgorithmClass
  dataStructure: DataStructure
  confidence: number
  tier: DetectionTier
  label: string
  tier1Score: number
  tier2Score: number
  tier3Score: number
  visualHint: DataStructure
}

// ── Visual IR primitives ─────────────────────────────────────

export type CellState =
  | 'default'
  | 'current'
  | 'visited'
  | 'sorted'
  | 'swap'
  | 'found'
  | 'pivot'
  | 'comparing'

export type NodeState =
  | 'default'
  | 'visiting'
  | 'visited'
  | 'current'
  | 'found'
  | 'queued'

export type EdgeState = 'default' | 'traversed' | 'current'

export interface ArrayCell {
  index: number
  value: string | number
  state: CellState
}

export interface ArrayPointer {
  label: string
  index: number
  color?: string
}

export interface KeyBadge {
  value: string | number
  label: string
  result?: 'equal' | 'not_equal' | null
}

export interface GraphNode {
  id: string
  label: string
  state: NodeState
  x?: number
  y?: number
}

export interface GraphEdge {
  source: string
  target: string
  directed: boolean
  state: EdgeState
}

export interface LinkedListNode {
  id: string
  value: string | number
  state: NodeState
  hasNext: boolean
}

export interface StackFrame {
  value: string | number
  state: NodeState
  index: number
}

export interface DPCell {
  row: number
  col: number
  value: string | number
  state: CellState
}

// ── Visual IR frames ─────────────────────────────────────────

interface VisualIRBase {
  frameIndex: number
  lineNumber: number
  algorithmClass: AlgorithmClass
  dataStructure: DataStructure
  stepType: string
  tier: DetectionTier
  confidence: number
  narration: string
}

export interface ArrayVisualIR extends VisualIRBase {
  dataStructure: 'array'
  cells: ArrayCell[]
  pointers: ArrayPointer[]
  key?: KeyBadge
  comparingIndices?: [number, number]
  swappingIndices?: [number, number]
  sortedUpTo?: number
}

export interface GraphVisualIR extends VisualIRBase {
  dataStructure: 'graph'
  nodes: GraphNode[]
  edges: GraphEdge[]
  currentPath?: string[]
  visitedOrder?: string[]
  queue?: string[]
  stack?: string[]
}

export interface LinkedListVisualIR extends VisualIRBase {
  dataStructure: 'linked_list'
  nodes: LinkedListNode[]
  currentNodeId?: string
  headId?: string
}

export interface StackQueueVisualIR extends VisualIRBase {
  dataStructure: 'stack' | 'queue'
  frames: StackFrame[]
  topIndex?: number
  frontIndex?: number
  rearIndex?: number
}

export interface TreeVisualIR extends VisualIRBase {
  dataStructure: 'tree'
  nodes: GraphNode[]
  edges: GraphEdge[]
  rootId?: string
  currentPath?: string[]
}

export interface DPVisualIR extends VisualIRBase {
  dataStructure: 'dp_table'
  cells: DPCell[]
  rows: number
  cols: number
  currentCell?: { row: number; col: number }
  dependencyArrows?: Array<{
    from: { row: number; col: number }
    to: { row: number; col: number }
  }>
}

export interface GenericVisualIR extends VisualIRBase {
  dataStructure: 'generic'
  variables: Record<string, string>
  highlightedVars: string[]
}

export type VisualIRFrame =
  | ArrayVisualIR
  | GraphVisualIR
  | LinkedListVisualIR
  | StackQueueVisualIR
  | TreeVisualIR
  | DPVisualIR
  | GenericVisualIR

// ── Full classifier output ───────────────────────────────────

export interface ClassifierOutput {
  classification: ClassificationResult
  frames: VisualIRFrame[]
  sourceCode: string
  language: string
  processedAt: number
}
