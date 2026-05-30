import type { AlgorithmClass } from '../types'

export interface StructuralFeatures {
  nestedLoopDepth: number
  hasRecursion: boolean
  recursiveBranches: number
  usesQueue: boolean
  usesStack: boolean
  usesDict: boolean
  usesLinkedList: boolean
  swapCount: number
  hasKeyComparison: boolean
  hasMidCalc: boolean
  loopCount: number
}

function countMatches(src: string, re: RegExp): number {
  const m = src.match(re)
  return m ? m.length : 0
}

function estimateNestedLoopDepth(src: string): number {
  // Heuristic: track indentation depth of for/while keywords.
  const lines = src.split('\n')
  let maxDepth = 0
  const stack: number[] = [] // indentation levels of open loops
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '') continue
    const indent = line.length - line.trimStart().length
    // Pop loops we've dedented out of.
    while (stack.length > 0 && indent <= stack[stack.length - 1]) {
      stack.pop()
    }
    if (/^\s*(for|while)\b/.test(line) || /\b(for|while)\s*\(/.test(line)) {
      stack.push(indent)
      if (stack.length > maxDepth) maxDepth = stack.length
    }
  }
  return maxDepth
}

export function extractFeatures(
  sourceCode: string,
  _language: string
): StructuralFeatures {
  const src = sourceCode

  // Recursion: find first function name, see if it appears again.
  let hasRecursion = false
  let recursiveBranches = 0
  const fnMatch = src.match(
    /(?:def|function|void|int|static\s+\w+)\s+(\w+)\s*\(/
  )
  if (fnMatch) {
    const name = fnMatch[1]
    const calls = countMatches(src, new RegExp(`\\b${name}\\s*\\(`, 'g'))
    // First match is the declaration itself.
    recursiveBranches = Math.max(0, calls - 1)
    hasRecursion = recursiveBranches >= 1
  }

  const loopCount = countMatches(src, /\b(for|while)\b/g)

  return {
    nestedLoopDepth: estimateNestedLoopDepth(src),
    hasRecursion,
    recursiveBranches,
    usesQueue: /deque|queue|Queue|collections\.deque/i.test(src),
    usesStack: /\.append\([^)]*\)[\s\S]*\.pop\(\)|\bstack\b|Stack/i.test(src),
    usesDict: /\bdict\b|\bHashMap\b|\bMap\b|\{\}/.test(src),
    usesLinkedList: /\.next\b|->next/.test(src),
    swapCount:
      countMatches(src, /temp\s*=[\s\S]*?=\s*temp/g) +
      countMatches(src, /\[[^\]]+\],\s*\[[^\]]+\]\s*=/g) +
      countMatches(src, /\bswap\s*\(/g),
    hasKeyComparison:
      /(arr|nums|a|data)\s*\[[^\]]+\]\s*[=!]==?\s*(key|target|val|x)/.test(src),
    hasMidCalc:
      /mid\s*=[\s\S]{0,40}(low|left|start)[\s\S]{0,40}(high|right|end)/i.test(
        src
      ) || /(low|left)\s*\+\s*\(?\s*(high|right)[\s\S]{0,20}\/\s*2/i.test(src),
    loopCount,
  }
}

export function scoreFromFeatures(
  features: StructuralFeatures
): Array<{ algorithmClass: AlgorithmClass; score: number }> {
  const out: Array<{ algorithmClass: AlgorithmClass; score: number }> = []

  if (features.hasMidCalc) out.push({ algorithmClass: 'binary_search', score: 0.85 })
  if (features.hasKeyComparison && features.nestedLoopDepth <= 1)
    out.push({ algorithmClass: 'linear_search', score: 0.75 })
  if (features.nestedLoopDepth >= 2 && features.swapCount > 0)
    out.push({ algorithmClass: 'bubble_sort', score: 0.8 })
  if (features.nestedLoopDepth >= 2 && features.swapCount === 0)
    out.push({ algorithmClass: 'selection_sort', score: 0.65 })
  if (features.usesQueue && !features.hasRecursion)
    out.push({ algorithmClass: 'bfs', score: 0.82 })
  if (features.usesStack && !features.hasRecursion)
    out.push({ algorithmClass: 'dfs', score: 0.7 })
  if (features.hasRecursion && features.recursiveBranches >= 2) {
    out.push({ algorithmClass: 'merge_sort', score: 0.6 })
    out.push({ algorithmClass: 'binary_tree', score: 0.6 })
  }
  if (features.usesLinkedList)
    out.push({ algorithmClass: 'linked_list', score: 0.85 })
  if (features.usesDict) out.push({ algorithmClass: 'hashmap', score: 0.75 })

  return out
}
