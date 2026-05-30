import { matchLinearSearch } from './linearSearch'
import { matchBinarySearch } from './binarySearch'
import { matchBubbleSort } from './bubbleSort'
import { matchSelectionSort } from './selectionSort'
import { matchBFS } from './bfs'
import { matchDFS } from './dfs'
import { matchLinkedList } from './linkedList'
import type { Matcher } from './helpers'
import type { TraceFrame, AlgorithmClass } from '../types'

export interface Tier1Result {
  algorithmClass: AlgorithmClass
  score: number
  evidence: string[]
  allScores: Partial<Record<AlgorithmClass, number>>
}

export function runTier1(frames: TraceFrame[]): Tier1Result {
  const matchers: Matcher[] = [
    matchLinearSearch,
    matchBinarySearch,
    matchBubbleSort,
    matchSelectionSort,
    matchBFS,
    matchDFS,
    matchLinkedList,
  ]

  const results = matchers.map((m) => m(frames))
  const best = results.reduce((a, b) => (b.score > a.score ? b : a))

  const allScores = results.reduce(
    (acc, r) => {
      acc[r.algorithmClass] = r.score
      return acc
    },
    {} as Partial<Record<AlgorithmClass, number>>
  )

  return {
    algorithmClass: best.algorithmClass,
    score: best.score,
    evidence: best.evidence,
    allScores,
  }
}
