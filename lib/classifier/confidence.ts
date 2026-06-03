import type { DetectionTier } from './types'

export const CONFIDENCE_THRESHOLD = 0.75

export interface TierScores {
  tier1: number
  tier2: number
  tier3: number
}

export function combineScores(scores: TierScores): number {
  return Math.max(scores.tier1, scores.tier2, scores.tier3)
}

export function meetsThreshold(score: number): boolean {
  return score >= CONFIDENCE_THRESHOLD
}

export function selectTier(scores: TierScores): DetectionTier {
  if (scores.tier3 >= CONFIDENCE_THRESHOLD) return 3
  if (scores.tier2 >= CONFIDENCE_THRESHOLD) return 2
  if (scores.tier1 >= CONFIDENCE_THRESHOLD) return 1
  return 0
}
