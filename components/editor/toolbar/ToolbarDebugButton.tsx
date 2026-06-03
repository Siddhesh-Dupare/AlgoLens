'use client'

import { Bug, BugOff } from 'lucide-react'
import ToolbarButton from './ToolbarButton'
import type { ToolbarMode } from './toolbar.types'

interface ToolbarDebugButtonProps {
  mode: ToolbarMode
  disabled: boolean
  onDebug: () => void
  onStop: () => void
}

export default function ToolbarDebugButton({
  mode,
  disabled,
  onDebug,
  onStop,
}: ToolbarDebugButtonProps) {
  const debugging =
    mode === 'debugging' || mode === 'stepping' || mode === 'paused'

  if (debugging) {
    return (
      <ToolbarButton
        icon={<BugOff size={14} />}
        label="Stop Debug"
        variant="danger"
        size="md"
        tooltip="Stop debugger"
        shortcut="Shift+F5"
        isActive
        onClick={onStop}
      />
    )
  }

  return (
    <ToolbarButton
      icon={<Bug size={14} />}
      label="Debug"
      variant="debug"
      size="md"
      tooltip="Start debugger"
      shortcut="F9"
      disabled={disabled}
      onClick={onDebug}
    />
  )
}
