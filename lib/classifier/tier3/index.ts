import { getCached, setCached } from './cache'
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt'
import type {
  ClassificationResult,
  AlgorithmClass,
  DataStructure,
} from '../types'

export async function runTier3(
  sourceCode: string,
  language: string,
  apiKey: string
): Promise<ClassificationResult | null> {
  const cached = await getCached(sourceCode)
  if (cached) {
    console.log('[Tier3] Cache hit')
    return cached
  }

  if (!apiKey) {
    console.log('[Tier3] No API key — skipping')
    return null
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 256,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: buildUserPrompt(sourceCode, language) },
        ],
      }),
    })

    if (!response.ok) {
      console.warn('[Tier3] API error:', response.status)
      return null
    }

    const data = await response.json()
    const text: string = data?.content?.[0]?.text ?? ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    const result: ClassificationResult = {
      algorithmClass: parsed.algorithmClass as AlgorithmClass,
      dataStructure: parsed.dataStructure as DataStructure,
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence))),
      tier: 3,
      label: parsed.label ?? parsed.algorithmClass,
      tier1Score: 0,
      tier2Score: 0,
      tier3Score: Number(parsed.confidence),
      visualHint: parsed.visualHint as DataStructure,
    }

    await setCached(sourceCode, result)
    return result
  } catch (err) {
    console.warn('[Tier3] Failed:', err)
    return null
  }
}
