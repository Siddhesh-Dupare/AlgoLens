import { emitArray } from './arrayEmitter'
import { emitGraph } from './graphEmitter'
import { emitLinkedList } from './linkedListEmitter'
import { emitStackQueue } from './stackQueueEmitter'
import { emitGeneric } from './genericEmitter'
import type {
  AlgorithmClass,
  VisualIRFrame,
  TraceFrame,
  DetectionTier,
} from '../types'

const ARRAY_ALGOS: AlgorithmClass[] = [
  'linear_search',
  'binary_search',
  'bubble_sort',
  'selection_sort',
  'insertion_sort',
  'merge_sort',
  'quick_sort',
]

const GRAPH_ALGOS: AlgorithmClass[] = ['bfs', 'dfs']

export function emitVisualIR(
  frames: TraceFrame[],
  algorithmClass: AlgorithmClass,
  confidence: number,
  tier: DetectionTier
): VisualIRFrame[] {
  if (ARRAY_ALGOS.includes(algorithmClass))
    return emitArray(frames, algorithmClass, confidence, tier)

  if (GRAPH_ALGOS.includes(algorithmClass))
    return emitGraph(frames, algorithmClass, confidence, tier)

  if (algorithmClass === 'linked_list')
    return emitLinkedList(frames, algorithmClass, confidence, tier)

  if (algorithmClass === 'stack' || algorithmClass === 'queue')
    return emitStackQueue(frames, algorithmClass, confidence, tier)

  return emitGeneric(frames, algorithmClass, confidence)
}
