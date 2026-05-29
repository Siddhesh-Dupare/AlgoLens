'use client'

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
  return (
    <div
      className="tabs-no-scrollbar"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 35,
        background: '#252526',
        borderBottom: '1px solid #1e1e1e',
        overflowX: 'auto',
        overflowY: 'hidden',
        flexShrink: 0,
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
          minWidth: 0,
          alignSelf: 'stretch',
          background: '#252526',
          borderBottom: '1px solid #1e1e1e',
        }}
      />
    </div>
  )
}
