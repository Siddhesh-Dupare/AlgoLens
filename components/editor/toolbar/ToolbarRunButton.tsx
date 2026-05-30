'use client'

import { Play, Square } from 'lucide-react'
import ToolbarButton from './ToolbarButton'
import type { ToolbarMode } from './toolbar.types'

interface ToolbarRunButtonProps {
  mode: ToolbarMode
  disabled: boolean
  onRun: () => void
  onStop: () => void
}

export default function ToolbarRunButton({
  mode,
  disabled,
  onRun,
  onStop,
}: ToolbarRunButtonProps) {
  if (mode === 'running') {
    return (
      <ToolbarButton
        icon={<Square size={14} />}
        label="Stop"
        variant="danger"
        size="md"
        tooltip="Stop execution"
        shortcut="Shift+F5"
        onClick={onStop}
      />
    )
  }

  return (
    <ToolbarButton
      icon={<Play size={14} />}
      label="Run"
      variant="run"
      size="md"
      tooltip="Run code"
      shortcut="F5"
      disabled={disabled}
      isLoading={false}
      onClick={onRun}
    />
  )
}
