'use client'

import { useEffect, useState } from 'react'
import { useTelemetryStore } from '@/store/useTelemetryStore'

interface StudyTask {
  id: string
  description: string
}

export const STUDY_TASKS: StudyTask[] = [
  { id: 'task1', description: 'Debug this linear search. What value is being searched for, and at which index is it found?' },
  { id: 'task2', description: 'Debug this bubble sort. How many swaps happen in the first pass?' },
  { id: 'task3', description: 'Debug this selection sort. What is the minimum element found in the first pass?' },
  { id: 'task4', description: 'Debug this binary search. How many comparisons does it take to find 30?' },
  { id: 'task5', description: 'Debug this BFS. In what order are the nodes visited starting from A?' },
  { id: 'task6', description: 'Debug this DFS. Which node is visited third?' },
  { id: 'task7', description: 'Debug this linked list traversal. What is the value at the 3rd node?' },
  { id: 'task8', description: 'Debug this insertion sort. After the first 3 passes, what does the array look like?' },
  { id: 'task9', description: 'Debug this merge sort. At what recursion depth does the merging begin?' },
  { id: 'task10', description: 'Debug this quick sort. What is the pivot value in the first partition?' },
]

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function StudyPanel() {
  const isStudyMode = useTelemetryStore((s) => s.isStudyMode)
  const isControlMode = useTelemetryStore((s) => s.isControlMode)
  const participantId = useTelemetryStore((s) => s.participantId)
  const currentTaskId = useTelemetryStore((s) => s.currentTaskId)
  const session = useTelemetryStore((s) => s.currentSession)
  const markUnderstood = useTelemetryStore((s) => s.markUnderstood)
  const recordClarityRating = useTelemetryStore((s) => s.recordClarityRating)
  const endTask = useTelemetryStore((s) => s.endTask)
  const startTask = useTelemetryStore((s) => s.startTask)
  const disableStudyMode = useTelemetryStore((s) => s.disableStudyMode)

  const [collapsed, setCollapsed] = useState(false)
  const [, setTick] = useState(0)

  // Tick every second so the elapsed timer updates.
  useEffect(() => {
    if (!isStudyMode) return
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [isStudyMode])

  if (!isStudyMode) return null

  const taskIndex = STUDY_TASKS.findIndex((t) => t.id === currentTaskId)
  const task = STUDY_TASKS[taskIndex] ?? null
  const isLast = taskIndex === STUDY_TASKS.length - 1
  const understood = !!session && session.timeToAnswer > 0
  const rating = session?.clarityRating ?? 0
  const elapsed = session ? Date.now() - session.startTime : 0

  const next = () => {
    endTask()
    if (isLast) {
      disableStudyMode()
    } else {
      startTask(STUDY_TASKS[taskIndex + 1].id)
    }
  }

  return (
    <div
      style={{
        height: collapsed ? 36 : 200,
        flexShrink: 0,
        background: '#0a0a14',
        borderTop: '1px solid #2a2a4f',
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'height 150ms ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24' }}>
          {isControlMode ? 'Control Study' : 'Study'} · {participantId} ·{' '}
          {task ? `Task ${taskIndex + 1}/${STUDY_TASKS.length}` : 'No task'} ·{' '}
          {fmt(elapsed)}
        </span>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#71717a',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          {collapsed ? '▲ expand' : '▼ collapse'}
        </button>
      </div>

      {!collapsed && task && (
        <div style={{ padding: '0 14px 14px', overflowY: 'auto' }}>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: '#cbd5e1', marginBottom: 12 }}>
            {task.description}
          </div>

          {!understood ? (
            <button
              type="button"
              onClick={markUnderstood}
              style={primaryBtn}
            >
              I understand this algorithm
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#a1a1aa' }}>Clarity:</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => recordClarityRating(n)}
                    aria-label={`${n} stars`}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 18,
                      color: n <= rating ? '#fbbf24' : '#3f3f46',
                      padding: 0,
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={next}
                disabled={rating === 0}
                style={{
                  ...primaryBtn,
                  opacity: rating === 0 ? 0.5 : 1,
                  cursor: rating === 0 ? 'default' : 'pointer',
                }}
              >
                {isLast ? 'Finish Study' : 'Next Task'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const primaryBtn: React.CSSProperties = {
  background: '#4f46e5',
  border: 'none',
  borderRadius: 6,
  color: '#fff',
  fontSize: 13,
  fontWeight: 500,
  padding: '7px 16px',
  cursor: 'pointer',
}
