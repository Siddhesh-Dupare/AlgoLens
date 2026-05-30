'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import EditorTab from './EditorTab'
import type { TabItem } from './tabs.types'

interface EditorTabsProps {
  tabs: TabItem[]
  activeTabId: string | null
  onTabClick: (id: string) => void
  onTabClose: (id: string) => void
}

export default function EditorTabs({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
}: EditorTabsProps) {
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = () => {
    const el = tabsContainerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }

  useEffect(() => {
    updateScrollState()
    const el = tabsContainerRef.current
    if (!el) return
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)
    return () => observer.disconnect()
  }, [tabs.length])

  const handleWheel = (e: React.WheelEvent) => {
    if (!tabsContainerRef.current) return
    e.preventDefault()
    tabsContainerRef.current.scrollLeft += e.deltaY
    updateScrollState()
  }

  const scrollBy = (amount: number) => {
    tabsContainerRef.current?.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <div
      style={{
        position: 'relative',
        height: 35,
        flexShrink: 0,
        background: '#252526',
        borderBottom: '1px solid #1e1e1e',
      }}
    >
      <div
        ref={tabsContainerRef}
        className="tabs-no-scrollbar"
        onWheel={handleWheel}
        onScroll={updateScrollState}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end',
          height: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
        {tabs.map((tab) => (
          <EditorTab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onClick={() => onTabClick(tab.id)}
            onClose={(e) => {
              e.stopPropagation()
              onTabClose(tab.id)
            }}
          />
        ))}

        <div
          style={{
            flex: 1,
            minWidth: 40,
            alignSelf: 'stretch',
            background: '#252526',
            borderBottom: '1px solid #1e1e1e',
          }}
        />
      </div>

      {canScrollLeft && (
        <button
          type="button"
          aria-label="Scroll tabs left"
          onClick={() => scrollBy(-120)}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: 35,
            width: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            color: '#cccccc',
            background:
              'linear-gradient(to right, #252526 60%, transparent)',
          }}
        >
          <ChevronLeft size={14} />
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          aria-label="Scroll tabs right"
          onClick={() => scrollBy(120)}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            height: 35,
            width: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            color: '#cccccc',
            background:
              'linear-gradient(to left, #252526 60%, transparent)',
          }}
        >
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}
