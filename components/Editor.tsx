'use client'

import MenuBar from '@/components/menubar/MenuBar'
import MonacoEditor from '@/components/monaco/MonacoEditor'

export default function Editor() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#1e1e1e',
      }}
    >
      <MenuBar />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <MonacoEditor />
      </div>
    </div>
  )
}
