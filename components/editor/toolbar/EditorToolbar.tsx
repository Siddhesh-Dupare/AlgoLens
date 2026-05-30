'use client'

import { ChevronLeft, ChevronRight, FastForward, Pause, Settings } from 'lucide-react'
import ToolbarButton from './ToolbarButton'
import ToolbarDivider from './ToolbarDivider'
import ToolbarLanguageSelector from './ToolbarLanguageSelector'
import ToolbarStepCounter from './ToolbarStepCounter'
import ToolbarRunButton from './ToolbarRunButton'
import ToolbarDebugButton from './ToolbarDebugButton'
import ToolbarBreadcrumb from './ToolbarBreadcrumb'
import type { ToolbarMode, SupportedLanguage, StepState } from './toolbar.types'

interface EditorToolbarProps {
  mode: ToolbarMode
  language: SupportedLanguage
  stepState: StepState
  hasActiveFile: boolean
  breadcrumb: {
    rootName: string | null
    filePath: string | null
    fileName: string | null
  }
  activeTabIsDirty: boolean
  onLanguageChange: (lang: SupportedLanguage) => void
  onRun: () => void
  onDebug: () => void
  onStop: () => void
  onStepForward: () => void
  onStepBack: () => void
  onPlayThrough: () => void
}

export default function EditorToolbar({
  mode,
  language,
  stepState,
  hasActiveFile,
  breadcrumb,
  activeTabIsDirty,
  onLanguageChange,
  onRun,
  onDebug,
  onStop,
  onStepForward,
  onStepBack,
  onPlayThrough,
}: EditorToolbarProps) {
  const canStep =
    (mode === 'debugging' || mode === 'stepping' || mode === 'paused') &&
    stepState.totalFrames > 0
  const canStepForward = canStep && stepState.currentFrame < stepState.totalFrames
  const canStepBack = canStep && stepState.currentFrame > 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        height: '44px',
        background: '#1a1a1a',
        borderBottom: '1px solid #2d2d2d',
        padding: '0 10px',
        gap: '4px',
        flexShrink: 0,
        // overflow is visible (not hidden) so the language dropdown can extend
        // below the bar; the relative+zIndex stacks it above the editor area.
        overflow: 'visible',
        userSelect: 'none',
        position: 'relative',
        zIndex: 60,
      }}
    >
      {/* LEFT: Language selector */}
      <ToolbarLanguageSelector
        currentLanguage={language}
        onChange={onLanguageChange}
        disabled={mode === 'running' || mode === 'debugging'}
      />

      <ToolbarDivider />

      {/* Run + Debug */}
      <ToolbarRunButton
        mode={mode}
        disabled={!hasActiveFile}
        onRun={onRun}
        onStop={onStop}
      />
      <ToolbarDebugButton
        mode={mode}
        disabled={!hasActiveFile}
        onDebug={onDebug}
        onStop={onStop}
      />

      <ToolbarDivider />

      {/* Step controls */}
      <ToolbarButton
        icon={<ChevronLeft size={15} />}
        tooltip="Step Back"
        shortcut="F11"
        variant="step"
        size="sm"
        disabled={!canStepBack}
        isActive={false}
        onClick={onStepBack}
      />
      <ToolbarButton
        icon={<ChevronRight size={15} />}
        label="Step"
        tooltip="Step Forward"
        shortcut="F10"
        variant="step"
        size="sm"
        disabled={!canStepForward}
        isActive={canStep}
        onClick={onStepForward}
      />
      <ToolbarButton
        icon={stepState.isPlaying ? <Pause size={14} /> : <FastForward size={14} />}
        tooltip={stepState.isPlaying ? 'Pause' : 'Play Through'}
        shortcut="F8"
        variant="step"
        size="sm"
        disabled={!canStep || stepState.totalFrames === 0}
        isActive={stepState.isPlaying}
        onClick={onPlayThrough}
      />

      <ToolbarStepCounter
        currentFrame={stepState.currentFrame}
        totalFrames={stepState.totalFrames}
        mode={mode}
      />

      {/* MIDDLE: breadcrumb (takes the flexible space, pushing settings right) */}
      <ToolbarBreadcrumb
        rootName={breadcrumb.rootName}
        filePath={breadcrumb.filePath}
        fileName={breadcrumb.fileName}
        isDirty={activeTabIsDirty}
      />

      <ToolbarDivider />

      <ToolbarButton
        icon={<Settings size={14} />}
        tooltip="Settings"
        variant="default"
        size="sm"
        onClick={() => {
          window.dispatchEvent(new CustomEvent('algolens:open-settings'))
        }}
      />
    </div>
  )
}
