import type {
  TraceFrame,
  LinkedListVisualIR,
  LinkedListNode,
  AlgorithmClass,
  DetectionTier,
} from '../types'

const PTR_NAMES = ['current', 'cur', 'node', 'head', 'ptr', 'temp']

export function emitLinkedList(
  frames: TraceFrame[],
  algorithmClass: AlgorithmClass,
  confidence: number,
  tier: DetectionTier
): LinkedListVisualIR[] {
  return frames.map((frame, idx) => {
    let ptr: { name: string; value: string } | null = null
    for (const n of PTR_NAMES) {
      const v = frame.variables[n]
      if (v) {
        ptr = { name: n, value: v.value }
        break
      }
    }

    const isNull = ptr ? ptr.value === 'None' || ptr.value === 'null' : true
    const nodes: LinkedListNode[] = ptr
      ? [
          {
            id: 'cur',
            value: ptr.value,
            state: 'current',
            hasNext: !isNull,
          },
        ]
      : []

    return {
      frameIndex: idx,
      lineNumber: frame.lineNumber,
      algorithmClass,
      dataStructure: 'linked_list',
      stepType: frame.stepType,
      tier,
      confidence,
      narration: ptr
        ? `Line ${frame.lineNumber}: pointer ${ptr.name} = ${ptr.value}.`
        : `Line ${frame.lineNumber}: traversing list.`,
      nodes,
      currentNodeId: nodes[0]?.id,
    }
  })
}
