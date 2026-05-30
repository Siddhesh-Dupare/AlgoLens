import type {
  TraceFrame,
  TreeVisualIR,
  AlgorithmClass,
  DetectionTier,
} from '../types'

// Stub — returns empty tree frames. The tree renderer arrives in Phase 5,
// and binary_tree currently routes to the generic emitter in the factory.
export function emitTree(
  frames: TraceFrame[],
  algorithmClass: AlgorithmClass,
  confidence: number,
  tier: DetectionTier
): TreeVisualIR[] {
  return frames.map((frame, idx) => ({
    frameIndex: idx,
    lineNumber: frame.lineNumber,
    algorithmClass,
    dataStructure: 'tree',
    stepType: frame.stepType,
    tier,
    confidence,
    narration: `Line ${frame.lineNumber}: tree operation.`,
    nodes: [],
    edges: [],
  }))
}
