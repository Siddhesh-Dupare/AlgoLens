'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import type { SupportedLanguage } from './toolbar.types'

interface ToolbarLanguageSelectorProps {
  currentLanguage: SupportedLanguage
  onChange: (lang: SupportedLanguage) => void
  disabled?: boolean
}

interface LangInfo {
  id: SupportedLanguage
  label: string
  dot: string
}

const LANGUAGES: LangInfo[] = [
  { id: 'python', label: 'Python', dot: '#3b8eea' },
  { id: 'javascript', label: 'JavaScript', dot: '#f1c40f' },
  { id: 'cpp', label: 'C++', dot: '#9b59b6' },
  { id: 'c', label: 'C', dot: '#8e44ad' },
  { id: 'java', label: 'Java', dot: '#e74c3c' },
]

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  )
}

export default function ToolbarLanguageSelector({
  currentLanguage,
  onChange,
  disabled = false,
}: ToolbarLanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [isOpen])

  const current =
    LANGUAGES.find((l) => l.id === currentLanguage) ?? LANGUAGES[0]

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select language"
        onClick={() => !disabled && setIsOpen((p) => !p)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          background: '#252526',
          border: `1px solid ${hovered && !disabled ? '#5a5a5a' : '#3c3c3c'}`,
          borderRadius: 5,
          cursor: disabled ? 'not-allowed' : 'pointer',
          height: 28,
          color: '#cccccc',
          fontSize: 12,
          fontFamily: 'inherit',
          opacity: disabled ? 0.5 : 1,
          transition: 'border-color 150ms',
          flexShrink: 0,
        }}
      >
        <Dot color={current.dot} />
        <span>{current.label}</span>
        <ChevronDown
          size={12}
          color="#6a6a6a"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms',
          }}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: 160,
            background: '#252526',
            border: '1px solid #3c3c3c',
            borderRadius: 6,
            padding: '4px 0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 300,
            overflow: 'hidden',
          }}
        >
          {LANGUAGES.map((lang) => {
            const isCurrent = lang.id === currentLanguage
            return (
              <LangRow
                key={lang.id}
                lang={lang}
                isCurrent={isCurrent}
                onSelect={() => {
                  onChange(lang.id)
                  setIsOpen(false)
                  window.dispatchEvent(
                    new CustomEvent('algolens:set-language', {
                      detail: { language: lang.id },
                    })
                  )
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function LangRow({
  lang,
  isCurrent,
  onSelect,
}: {
  lang: LangInfo
  isCurrent: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  let background = 'transparent'
  if (isCurrent) background = '#094771'
  else if (hovered) background = '#2a2d2e'

  return (
    <div
      role="option"
      aria-selected={isCurrent}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        cursor: 'pointer',
        fontSize: 12,
        color: isCurrent ? '#ffffff' : '#cccccc',
        background,
        borderRadius: 3,
        margin: '0 4px',
      }}
    >
      <Dot color={lang.dot} />
      <span>{lang.label}</span>
      {isCurrent && (
        <Check size={12} color="#60a5fa" style={{ marginLeft: 'auto' }} />
      )}
    </div>
  )
}
