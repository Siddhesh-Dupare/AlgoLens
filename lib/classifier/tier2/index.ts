import { scanNames } from './nameScanner'
import { extractFeatures, scoreFromFeatures } from './structuralScanner'
import type { AlgorithmClass } from '../types'

export interface Tier2Result {
  algorithmClass: AlgorithmClass
  score: number
  method: 'name' | 'structural'
}

export function runTier2(sourceCode: string, language: string): Tier2Result {
  const nameResults = scanNames(sourceCode)
  const features = extractFeatures(sourceCode, language)
  const structResults = scoreFromFeatures(features)

  const allResults: Tier2Result[] = [
    ...nameResults.map((r) => ({
      algorithmClass: r.algorithmClass,
      score: r.score,
      method: 'name' as const,
    })),
    ...structResults.map((r) => ({
      algorithmClass: r.algorithmClass,
      score: r.score,
      method: 'structural' as const,
    })),
  ]

  if (allResults.length === 0) {
    return { algorithmClass: 'generic', score: 0, method: 'name' }
  }

  return allResults.sort((a, b) => b.score - a.score)[0]
}
