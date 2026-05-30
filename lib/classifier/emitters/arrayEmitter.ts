import type {
  TraceFrame,
  ArrayVisualIR,
  ArrayCell,
  ArrayPointer,
  KeyBadge,
  AlgorithmClass,
  CellState,
  DetectionTier,
} from '../types'

const ARR_NAMES = ['arr', 'array', 'nums', 'data', 'numbers', 'a', 'lst', 'items', 'list']

function parseArray(value: string): (string | number)[] | null {
  try {
    const clean = value
      .replace(/'/g, '"')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
    const parsed = JSON.parse(clean)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function findArrayVar(
  frame: TraceFrame
): { name: string; values: (string | number)[] } | null {
  for (const name of ARR_NAMES) {
    const v = frame.variables[name]
    if (!v) continue
    const values = parseArray(v.value)
    if (values) return { name, values }
  }
  return null
}

function findIndexVar(
  frame: TraceFrame,
  names: string[]
): { name: string; value: number } | null {
  for (const name of names) {
    const v = frame.variables[name]
    if (!v) continue
    const parsed = parseInt(v.value, 10)
    if (!Number.isNaN(parsed)) return { name, value: parsed }
  }
  return null
}

function computeCellStates(
  frame: TraceFrame,
  values: (string | number)[],
  algorithmClass: AlgorithmClass,
  _frameIndex: number,
  prevFrame: TraceFrame | null
): CellState[] {
  const states: CellState[] = values.map(() => 'default')

  // Sorted region for bubble sort: last `i` elements settled.
  if (algorithmClass === 'bubble_sort') {
    const iVar = findIndexVar(frame, ['i'])
    if (iVar && iVar.value > 0) {
      for (let k = values.length - iVar.value; k < values.length; k++) {
        if (k >= 0) states[k] = 'sorted'
      }
    }
  }

  // Binary search active window.
  if (algorithmClass === 'binary_search') {
    const lo = findIndexVar(frame, ['low', 'left', 'lo'])
    const hi = findIndexVar(frame, ['high', 'right', 'hi'])
    if (lo && hi) {
      for (let k = lo.value; k <= hi.value; k++) {
        if (k >= 0 && k < values.length) states[k] = 'current'
      }
    }
  }

  const cur = findIndexVar(frame, ['j', 'i', 'cur', 'idx', 'index', 'mid'])
  if (cur && cur.value >= 0 && cur.value < values.length) {
    states[cur.value] = 'current'
    if (
      algorithmClass === 'bubble_sort' &&
      cur.value + 1 < values.length &&
      states[cur.value + 1] === 'default'
    ) {
      states[cur.value + 1] = 'comparing'
    }
  }

  // Swap detection: exactly two changed cells vs previous frame.
  if (prevFrame) {
    const prev = findArrayVar(prevFrame)
    if (prev && prev.values.length === values.length) {
      const changed: number[] = []
      for (let k = 0; k < values.length; k++) {
        if (String(values[k]) !== String(prev.values[k])) changed.push(k)
      }
      if (changed.length === 2) for (const k of changed) states[k] = 'swap'
    }
  }

  // Linear search found.
  if (algorithmClass === 'linear_search' && cur && cur.value < values.length) {
    const keyVar =
      frame.variables['key'] ??
      frame.variables['target'] ??
      frame.variables['val']
    if (keyVar && String(values[cur.value]) === keyVar.value) {
      states[cur.value] = 'found'
    }
  }

  return states
}

function buildArrayNarration(
  frame: TraceFrame,
  algoClass: AlgorithmClass,
  cells: ArrayCell[],
  pointers: ArrayPointer[],
  key?: KeyBadge
): string {
  const curPointer = pointers.find((p) => ['cur', 'i', 'j'].includes(p.label))
  if (!curPointer) return `Line ${frame.lineNumber}: executing.`

  const cell = cells[curPointer.index]
  const val = cell?.value ?? '?'

  if (algoClass === 'linear_search' && key) {
    const eq = key.result === 'equal'
    return eq
      ? `Found! arr[${curPointer.index}] = ${val} equals key ${key.value}.`
      : `Comparing arr[${curPointer.index}] = ${val} with key ${key.value}. Not equal, advancing.`
  }

  if (algoClass === 'bubble_sort') {
    const swapping = cells.filter((c) => c.state === 'swap')
    if (swapping.length === 2) {
      return `Swapping arr[${swapping[0].index}]=${swapping[0].value} and arr[${swapping[1].index}]=${swapping[1].value}.`
    }
    return `Comparing arr[${curPointer.index}]=${val} and adjacent element.`
  }

  return `Line ${frame.lineNumber}: processing index ${curPointer.index}, value ${val}.`
}

export function emitArray(
  frames: TraceFrame[],
  algorithmClass: AlgorithmClass,
  confidence: number,
  tier: DetectionTier
): ArrayVisualIR[] {
  return frames.map((frame, idx) => {
    const arrayVar = findArrayVar(frame)
    const values = arrayVar?.values ?? []
    const prevFrame = idx > 0 ? frames[idx - 1] : null

    const states = computeCellStates(
      frame,
      values,
      algorithmClass,
      idx,
      prevFrame
    )

    const cells: ArrayCell[] = values.map((v, i) => ({
      index: i,
      value: v,
      state: states[i] ?? 'default',
    }))

    const pointers: ArrayPointer[] = []
    const pointerSpecs = [
      { names: ['j', 'i', 'cur', 'idx', 'index'], label: 'cur' },
      { names: ['low', 'left', 'lo'], label: 'low' },
      { names: ['high', 'right', 'hi'], label: 'high' },
      { names: ['mid', 'middle'], label: 'mid' },
    ]
    for (const { names, label } of pointerSpecs) {
      const v = findIndexVar(frame, names)
      if (v && v.value >= 0 && v.value < values.length) {
        pointers.push({ label, index: v.value })
      }
    }

    let key: KeyBadge | undefined
    if (
      algorithmClass === 'linear_search' ||
      algorithmClass === 'binary_search'
    ) {
      const keyVar =
        frame.variables['key'] ??
        frame.variables['target'] ??
        frame.variables['val']
      if (keyVar) {
        const curIndex = findIndexVar(frame, [
          'j',
          'i',
          'cur',
          'idx',
          'index',
          'mid',
        ])
        const curVal =
          curIndex !== null ? values[curIndex.value] : undefined
        key = {
          value: keyVar.value,
          label: 'Key',
          result:
            curVal !== undefined
              ? String(curVal) === keyVar.value
                ? 'equal'
                : 'not_equal'
              : null,
        }
      }
    }

    const narration = buildArrayNarration(
      frame,
      algorithmClass,
      cells,
      pointers,
      key
    )

    return {
      frameIndex: idx,
      lineNumber: frame.lineNumber,
      algorithmClass,
      dataStructure: 'array',
      stepType: frame.stepType,
      tier,
      confidence,
      narration,
      cells,
      pointers,
      key,
    }
  })
}
