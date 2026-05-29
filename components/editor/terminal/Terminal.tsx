'use client'

import {
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import TerminalResizeHandle from './TerminalResizeHandle'
import TerminalToolbar from './TerminalToolbar'
import TerminalTabs from './TerminalTabs'
import TerminalBody from './TerminalBody'
import TerminalInput from './TerminalInput'
import type {
  TerminalInstance,
  TerminalLineType,
  ShellType,
} from './terminal.types'
import {
  createTerminalInstance,
  createTerminalLine,
  detectShellType,
} from './terminalUtils'

interface TerminalProps {
  isVisible: boolean
  height: number
  onHeightChange: (h: number) => void
  onClose: () => void
}

export interface TerminalHandle {
  addLine: (type: TerminalLineType, text: string) => void
  addLines: (lines: Array<{ type: TerminalLineType; text: string }>) => void
  clearActive: () => void
  newInstance: (title?: string, shellType?: ShellType) => void
  focus: () => void
}

const Terminal = forwardRef<TerminalHandle, TerminalProps>(function Terminal(
  { isVisible, height, onHeightChange, onClose },
  ref
) {
  const [instances, setInstances] = useState<TerminalInstance[]>(() => [
    createTerminalInstance(
      detectShellType() === 'powershell' ? 'powershell' : 'bash',
      detectShellType()
    ),
  ])
  const [activeInstanceId, setActiveInstanceId] = useState<string>(
    () => instances[0]?.id ?? ''
  )
  const [showTimestamps, setShowTimestamps] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [preMaximizeHeight, setPreMaximizeHeight] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)

  const addLineToActive = useCallback(
    (type: TerminalLineType, text: string) => {
      setInstances((prev) =>
        prev.map((instance) =>
          instance.id === activeInstanceId
            ? {
                ...instance,
                lines: [...instance.lines, createTerminalLine(type, text)],
              }
            : instance
        )
      )
    },
    [activeInstanceId]
  )

  const addLinesToActive = useCallback(
    (newLines: Array<{ type: TerminalLineType; text: string }>) => {
      setInstances((prev) =>
        prev.map((instance) =>
          instance.id === activeInstanceId
            ? {
                ...instance,
                lines: [
                  ...instance.lines,
                  ...newLines.map((l) => createTerminalLine(l.type, l.text)),
                ],
              }
            : instance
        )
      )
    },
    [activeInstanceId]
  )

  const clearActiveLines = useCallback(() => {
    setInstances((prev) =>
      prev.map((instance) =>
        instance.id === activeInstanceId
          ? { ...instance, lines: [] }
          : instance
      )
    )
  }, [activeInstanceId])

  const handleNewTerminal = useCallback(
    (title?: string, shellType?: ShellType) => {
      const instance = createTerminalInstance(title, shellType)
      setInstances((prev) => [...prev, instance])
      setActiveInstanceId(instance.id)
    },
    []
  )

  const handleTabClick = useCallback((id: string) => {
    setActiveInstanceId(id)
  }, [])

  const handleTabClose = useCallback(
    (id: string) => {
      setInstances((prev) => {
        if (prev.length <= 1) return prev
        const index = prev.findIndex((i) => i.id === id)
        if (index === -1) return prev
        const next = prev.filter((i) => i.id !== id)

        if (id === activeInstanceId) {
          const newIndex = Math.max(0, index - 1)
          const nextActive = next[newIndex]
          if (nextActive) setActiveInstanceId(nextActive.id)
        }
        return next
      })
    },
    [activeInstanceId]
  )

  const handleSubmit = useCallback(
    (command: string) => {
      addLinesToActive([
        { type: 'command', text: command },
        { type: 'system', text: 'Command execution not yet implemented.' },
        { type: 'system', text: 'Run/Debug integration coming soon.' },
      ])
    },
    [addLinesToActive]
  )

  const focusInput = useCallback(() => {
    const input = rootRef.current?.querySelector<HTMLInputElement>(
      '[data-terminal-active="true"] input'
    )
    input?.focus()
  }, [])

  const handleMaximize = useCallback(() => {
    if (!isMaximized) {
      setPreMaximizeHeight(height)
      onHeightChange(window.innerHeight - 35 - 35)
      setIsMaximized(true)
    } else {
      onHeightChange(preMaximizeHeight)
      setIsMaximized(false)
    }
  }, [isMaximized, height, preMaximizeHeight, onHeightChange])

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      const startY = e.clientY
      const startHeight = height

      const onMouseMove = (ev: MouseEvent) => {
        const delta = startY - ev.clientY
        const newHeight = Math.min(
          window.innerHeight * 0.8,
          Math.max(120, startHeight + delta)
        )
        onHeightChange(newHeight)
        if (isMaximized) setIsMaximized(false)
      }

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [height, isMaximized, onHeightChange]
  )

  useImperativeHandle(
    ref,
    () => ({
      addLine: (type, text) => addLineToActive(type, text),
      addLines: (lines) => addLinesToActive(lines),
      clearActive: () => clearActiveLines(),
      newInstance: (title, shellType) => handleNewTerminal(title, shellType),
      focus: () => focusInput(),
    }),
    [
      addLineToActive,
      addLinesToActive,
      clearActiveLines,
      handleNewTerminal,
      focusInput,
    ]
  )

  if (!isVisible) return null

  return (
    <div
      ref={rootRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: height,
        flexShrink: 0,
        background: '#1e1e1e',
        overflow: 'hidden',
        transition: 'height 0ms',
      }}
    >
      <TerminalResizeHandle onResizeStart={handleResizeStart} />

      <TerminalToolbar
        onClose={onClose}
        onClear={clearActiveLines}
        onToggleTimestamps={() => setShowTimestamps((p) => !p)}
        showTimestamps={showTimestamps}
        onMaximize={handleMaximize}
        isMaximized={isMaximized}
      />

      <TerminalTabs
        instances={instances}
        activeInstanceId={activeInstanceId}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onNewTerminal={() => handleNewTerminal()}
      />

      {instances.map((instance) => {
        const active = instance.id === activeInstanceId
        return (
          <div
            key={instance.id}
            data-terminal-active={active}
            style={{
              display: active ? 'flex' : 'none',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <TerminalBody
              lines={instance.lines}
              showTimestamps={showTimestamps}
            />
            <TerminalInput onSubmit={handleSubmit} isDisabled={false} />
          </div>
        )
      })}
    </div>
  )
})

export default Terminal
