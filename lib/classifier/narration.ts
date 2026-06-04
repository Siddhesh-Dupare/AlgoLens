import type { TraceFrame } from '@/lib/executionTypes'
import { chatAI, hasAIKey } from '@/lib/ai/client'
import type { ClassificationResult } from './types'

// One batch call per debug session: turn the mechanical default narrations into
// specific, educational sentences — one per execution step. Returns a string
// per frame index (aligned to the trace/IR frames). Returns [] on any failure,
// in which case callers keep the existing default narrations.

const MAX_FRAMES = 200

const SYSTEM_PROMPT =
  'You are an algorithm education assistant. Generate exactly one short ' +
  'plain-English sentence per execution step explaining what is happening at ' +
  'that step in the algorithm. Be specific about variable values. Be ' +
  'educational, not just descriptive. Return ONLY a JSON array of strings, ' +
  'one string per step, in order. No markdown, no backticks, no explanation ' +
  'outside the JSON array.'

interface CondensedStep {
  frameIndex: number
  lineNumber: number
  stepType: string
  changedVars: Array<{ name: string; value: string }>
}

function condenseFrames(frames: TraceFrame[]): CondensedStep[] {
  return frames.map((f) => ({
    frameIndex: f.frameIndex,
    lineNumber: f.lineNumber,
    stepType: f.stepType,
    changedVars: Object.values(f.variables ?? {})
      .filter((v) => v.changed)
      .map((v) => ({ name: v.name, value: v.value })),
  }))
}

function buildUserPrompt(
  steps: CondensedStep[],
  classification: ClassificationResult,
  language: string,
  sourceCode: string
): string {
  return [
    `Language: ${language}`,
    `Algorithm: ${classification.label} (${Math.round(
      classification.confidence * 100
    )}% confidence)`,
    '',
    'Source code:',
    sourceCode,
    '',
    `Execution steps (${steps.length} steps):`,
    JSON.stringify(steps),
  ].join('\n')
}

export interface GenerateNarrationsParams {
  traceFrames: TraceFrame[]
  classification: ClassificationResult
  language: string
  sourceCode: string
}

export async function generateNarrations({
  traceFrames,
  classification,
  language,
  sourceCode,
}: GenerateNarrationsParams): Promise<string[]> {
  if (!hasAIKey() || traceFrames.length === 0) return []

  // Cap the steps we send; frames beyond the cap keep their default narration.
  const steps = condenseFrames(traceFrames.slice(0, MAX_FRAMES))

  try {
    const text = await chatAI({
      system: SYSTEM_PROMPT,
      maxTokens: 8192,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(steps, classification, language, sourceCode),
        },
      ],
    })
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    if (!Array.isArray(parsed)) return []
    return parsed.map((s) => String(s))
  } catch (err) {
    console.warn('[Narration] Failed:', err)
    return []
  }
}
