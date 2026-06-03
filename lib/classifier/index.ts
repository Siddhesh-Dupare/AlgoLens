import { runTier1 } from './tier1'
import { runTier2 } from './tier2'
import { runTier3 } from './tier3'
import { emitVisualIR } from './emitters'
import { meetsThreshold } from './confidence'
import type {
  TraceFrame,
  ClassifierOutput,
  ClassificationResult,
  AlgorithmClass,
  DataStructure,
  DetectionTier,
} from './types'

function inferDataStructure(algo: AlgorithmClass): DataStructure {
  const map: Partial<Record<AlgorithmClass, DataStructure>> = {
    linear_search: 'array',
    binary_search: 'array',
    bubble_sort: 'array',
    selection_sort: 'array',
    insertion_sort: 'array',
    merge_sort: 'array',
    quick_sort: 'array',
    bfs: 'graph',
    dfs: 'graph',
    linked_list: 'linked_list',
    stack: 'stack',
    queue: 'queue',
    dynamic_programming: 'dp_table',
    hashmap: 'hashmap',
    binary_tree: 'tree',
    generic: 'generic',
  }
  return map[algo] ?? 'generic'
}

function getLabel(algo: AlgorithmClass): string {
  const labels: Partial<Record<AlgorithmClass, string>> = {
    linear_search: 'Linear Search',
    binary_search: 'Binary Search',
    bubble_sort: 'Bubble Sort',
    selection_sort: 'Selection Sort',
    insertion_sort: 'Insertion Sort',
    merge_sort: 'Merge Sort',
    quick_sort: 'Quick Sort',
    bfs: 'Breadth-First Search',
    dfs: 'Depth-First Search',
    linked_list: 'Linked List Traversal',
    stack: 'Stack Operations',
    queue: 'Queue Operations',
    dynamic_programming: 'Dynamic Programming',
    hashmap: 'Hash Map',
    binary_tree: 'Binary Tree',
    generic: 'Algorithm (unrecognized)',
  }
  return labels[algo] ?? algo
}

export interface ClassifyOptions {
  apiKey?: string
  language: string
}

export async function classify(
  frames: TraceFrame[],
  sourceCode: string,
  options: ClassifyOptions
): Promise<ClassifierOutput> {
  console.log('[Classifier] Starting pipeline...')
  console.log(
    `[Classifier] Frames: ${frames.length}, Language: ${options.language}`
  )

  const tier2 = runTier2(sourceCode, options.language)
  console.log(`[Classifier] Tier 2: ${tier2.algorithmClass} (${tier2.score.toFixed(2)})`)

  const tier1 = runTier1(frames)
  console.log(`[Classifier] Tier 1: ${tier1.algorithmClass} (${tier1.score.toFixed(2)})`)

  const combinedScore = Math.max(tier1.score, tier2.score)
  const leadAlgo =
    tier1.score >= tier2.score ? tier1.algorithmClass : tier2.algorithmClass
  const leadTier: DetectionTier = tier1.score >= tier2.score ? 1 : 2

  let finalAlgo: AlgorithmClass = leadAlgo
  let finalScore = combinedScore
  let finalTier: DetectionTier = leadTier
  let tier3Score = 0

  if (!meetsThreshold(combinedScore)) {
    console.log(
      `[Classifier] Score ${combinedScore.toFixed(2)} below threshold — invoking Tier 3`
    )
    const tier3Result = await runTier3(
      sourceCode,
      options.language,
      options.apiKey ?? ''
    )
    if (tier3Result) {
      tier3Score = tier3Result.confidence
      console.log(
        `[Classifier] Tier 3: ${tier3Result.algorithmClass} (${tier3Score.toFixed(2)})`
      )
      if (tier3Score > combinedScore) {
        finalAlgo = tier3Result.algorithmClass
        finalScore = tier3Score
        finalTier = 3
      }
    }
  }

  // If nothing cleared the bar, fall back to generic with tier 0.
  if (finalScore === 0) {
    finalAlgo = 'generic'
    finalTier = 0
  }

  const classification: ClassificationResult = {
    algorithmClass: finalAlgo,
    dataStructure: inferDataStructure(finalAlgo),
    confidence: finalScore,
    tier: finalTier,
    label: getLabel(finalAlgo),
    tier1Score: tier1.score,
    tier2Score: tier2.score,
    tier3Score,
    visualHint: inferDataStructure(finalAlgo),
  }

  console.log(
    `[Classifier] Final: ${classification.label}`,
    `(${(classification.confidence * 100).toFixed(0)}% confidence,`,
    `Tier ${classification.tier})`
  )

  const irFrames = emitVisualIR(
    frames,
    classification.algorithmClass,
    classification.confidence,
    classification.tier
  )

  return {
    classification,
    frames: irFrames,
    sourceCode,
    language: options.language,
    processedAt: Date.now(),
  }
}
