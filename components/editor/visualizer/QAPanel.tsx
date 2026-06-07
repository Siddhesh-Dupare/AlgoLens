'use client'

import { useEffect, useRef, useState } from 'react'
import type { ClassificationResult, VisualIRFrame } from '@/lib/classifier/types'
import { chatAI } from '@/lib/ai/client'
import { useTelemetryStore } from '@/store/useTelemetryStore'
import ComplexityChart from './ComplexityChart'

interface QAPanelProps {
  isOpen: boolean
  onClose: () => void
  currentFrame: VisualIRFrame | null
  classification: ClassificationResult | null
  sourceCode: string
  language: string
  hasKey: boolean
}

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

const QA_SYSTEM_PROMPT =
  'You are an algorithm education assistant embedded in a DSA visualizer. The ' +
  'user is watching a live algorithm execution step by step. Answer questions ' +
  'specifically about the current execution step shown. Be concise (2-4 ' +
  'sentences). Refer to specific variable values and line numbers from the ' +
  'context.'

// Build a context string from the CURRENT frame. The Visual IR frame is a
// discriminated union, so the relevant state differs by data structure.
function buildContext(
  frame: VisualIRFrame | null,
  classification: ClassificationResult | null
): string {
  if (!frame) return 'No active step is being shown.'
  const lines: string[] = [
    `Current step: ${frame.frameIndex}`,
    `Line: ${frame.lineNumber}`,
    `Step type: ${frame.stepType}`,
  ]
  if (classification) {
    lines.push(`Algorithm: ${classification.label}`)
    lines.push(`Confidence: ${Math.round(classification.confidence * 100)}%`)
  }

  if (frame.dataStructure === 'array') {
    lines.push(`Array: [${frame.cells.map((c) => c.value).join(', ')}]`)
    if (frame.pointers.length) {
      lines.push(
        'Pointers: ' +
          frame.pointers.map((p) => `${p.label}=${p.index}`).join(', ')
      )
    }
    if (frame.comparingIndices) {
      lines.push(`Comparing indices: ${frame.comparingIndices.join(' and ')}`)
    }
    if (frame.swappingIndices) {
      lines.push(`Swapping indices: ${frame.swappingIndices.join(' and ')}`)
    }
    const highlighted = frame.cells.filter((c) => c.state !== 'default')
    if (highlighted.length) {
      lines.push(
        'Highlighted cells: ' +
          highlighted
            .map((c) => `index ${c.index} (value ${c.value}, ${c.state})`)
            .join(', ')
      )
    }
    if (frame.key) {
      lines.push(
        `Search key: ${frame.key.value}` +
          (frame.key.result ? ` (${frame.key.result})` : '')
      )
    }
  } else if (frame.dataStructure === 'generic') {
    const vars = Object.entries(frame.variables)
    if (vars.length) {
      lines.push(
        'Current variable states:\n' +
          vars.map(([k, v]) => `  ${k} = ${v}`).join('\n')
      )
    }
    if (frame.highlightedVars.length) {
      lines.push('Highlighted variables: ' + frame.highlightedVars.join(', '))
    }
  } else if (frame.dataStructure === 'graph') {
    if (frame.visitedOrder?.length) {
      lines.push('Visited order: ' + frame.visitedOrder.join(', '))
    }
    if (frame.queue?.length) lines.push('Queue: ' + frame.queue.join(', '))
    if (frame.stack?.length) lines.push('Stack: ' + frame.stack.join(', '))
    if (frame.currentPath?.length) {
      lines.push('Current path: ' + frame.currentPath.join(' -> '))
    }
  }

  lines.push(`Current narration: ${frame.narration}`)
  return lines.join('\n')
}

export default function QAPanel({
  isOpen,
  onClose,
  currentFrame,
  classification,
  sourceCode,
  language,
  hasKey,
}: QAPanelProps) {
  const [tab, setTab] = useState<'ask' | 'analysis'>('ask')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Keep the message list scrolled to the newest message.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isLoading])

  if (!isOpen) return null

  const handleSend = async () => {
    const question = inputValue.trim()
    if (!question || isLoading || !hasKey) return
    useTelemetryStore.getState().recordQAQuery() // no-op outside study mode

    // Prior history (last 6 display messages) — sent before the contextful one.
    const priorForApi = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.text,
    }))

    setMessages((m) => [...m, { role: 'user', text: question }])
    setInputValue('')
    setIsLoading(true)

    // Read the LIVE current frame at send time (constraint: must reflect the
    // step the user is actually watching, not a session-start snapshot).
    const context = buildContext(currentFrame, classification)

    try {
      const text = await chatAI({
        system: QA_SYSTEM_PROMPT,
        maxTokens: 512,
        messages: [
          ...priorForApi,
          {
            role: 'user',
            content:
              `Language: ${language}\n\n` +
              `Source code:\n${sourceCode}\n\n` +
              `Context for the step the user is watching:\n${context}\n\n` +
              `Question: ${question}`,
          },
        ],
      })
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: text || '(no response)' },
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: `Request failed: ${msg}` },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        height: 240,
        flexShrink: 0,
        background: '#111113',
        borderTop: '1px solid #2a2a2f',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Tabs + close */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          borderBottom: '1px solid #1c1c1f',
        }}
      >
        <div style={{ display: 'flex', gap: 4 }}>
          {(['ask', 'analysis'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom:
                  tab === t ? '2px solid #2563eb' : '2px solid transparent',
                color: tab === t ? '#e2e8f0' : '#71717a',
                cursor: 'pointer',
                fontSize: 11,
                padding: '7px 8px',
              }}
            >
              {t === 'ask' ? 'Ask AI' : 'Analysis'}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          title="Close"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#71717a',
            cursor: 'pointer',
            fontSize: 14,
            lineHeight: 1,
            padding: 2,
          }}
        >
          ×
        </button>
      </div>

      {tab === 'analysis' ? (
        <ComplexityChart
          sourceCode={sourceCode}
          language={language}
          classification={classification}
          hasKey={hasKey}
        />
      ) : (
        <>
      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {messages.length === 0 && (
          <div style={{ fontSize: 12, color: '#52525b', lineHeight: 1.6 }}>
            {hasKey
              ? 'Ask about the current step — e.g. “what is j right now?” or “why did this swap happen?”'
              : 'Add a Claude or Gemini API key in Settings (the gear icon in the toolbar) to ask questions about this step.'}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: m.role === 'user' ? '#1e293b' : '#1c1c1f',
              color: '#d4d4d8',
              fontSize: 12,
              lineHeight: 1.6,
              padding: '6px 10px',
              borderRadius: 8,
              whiteSpace: 'pre-wrap',
            }}
          >
            {m.text}
          </div>
        ))}
        {isLoading && (
          <div
            style={{
              alignSelf: 'flex-start',
              fontSize: 12,
              color: '#71717a',
              padding: '6px 10px',
            }}
          >
            Thinking…
          </div>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '8px 12px',
          borderTop: '1px solid #1c1c1f',
        }}
      >
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!hasKey}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={hasKey ? 'Ask about this step...' : 'API key required'}
          style={{
            flex: 1,
            background: '#0a0a0c',
            border: '1px solid #2a2a2f',
            borderRadius: 6,
            color: '#e2e8f0',
            fontSize: 12,
            padding: '6px 10px',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !inputValue.trim()}
          style={{
            background: '#2563eb',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            fontSize: 12,
            padding: '0 14px',
            cursor: isLoading || !inputValue.trim() ? 'default' : 'pointer',
            opacity: isLoading || !inputValue.trim() ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </div>
        </>
      )}
    </div>
  )
}
