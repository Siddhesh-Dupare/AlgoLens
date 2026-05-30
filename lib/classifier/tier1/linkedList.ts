import type { Matcher } from './helpers'

export const matchLinkedList: Matcher = (frames) => {
  if (frames.length < 2)
    return { algorithmClass: 'linked_list', score: 0, evidence: [] }

  const evidence: string[] = []
  let score = 0

  const nodeNames = ['node', 'current', 'cur', 'head', 'ptr', 'temp']
  const hasNodeVar = frames.some((f) =>
    nodeNames.some((n) => f.variables[n] !== undefined)
  )

  const hasNextRef = frames.some((f) =>
    Object.values(f.variables).some(
      (v) =>
        v.value.includes('.next') ||
        v.value.includes('->next') ||
        v.type === 'ListNode' ||
        v.type === 'Node'
    )
  )

  const hasNullTerminal = frames.some((f) =>
    Object.values(f.variables).some(
      (v) => v.value === 'None' || v.value === 'null'
    )
  )

  if (hasNodeVar) {
    score += 0.35
    evidence.push('node/pointer variable detected')
  }
  if (hasNextRef) {
    score += 0.45
    evidence.push('.next reference in trace')
  }
  if (hasNullTerminal) {
    score += 0.2
    evidence.push('null terminal detected')
  }

  return { algorithmClass: 'linked_list', score: Math.min(score, 1), evidence }
}
