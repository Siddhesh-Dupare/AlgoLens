'use client'

import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Braces,
  File,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import type { FileLanguage } from './explorer.types'

interface FileIconProps {
  name: string
  language?: FileLanguage
  isFolder?: boolean
  isOpen?: boolean
}

const ICON_SIZE = 15

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  flexShrink: 0,
  verticalAlign: 'middle',
}

function extOf(name: string): string {
  const idx = name.lastIndexOf('.')
  if (idx <= 0) return '' // no extension, or dot file (handled separately)
  return name.slice(idx).toLowerCase()
}

export default function FileIcon({
  name,
  language,
  isFolder,
  isOpen,
}: FileIconProps) {
  if (isFolder) {
    const Comp = isOpen ? FolderOpen : Folder
    return <Comp size={ICON_SIZE} color="#dcb67a" style={baseStyle} />
  }

  const ext = extOf(name)

  // Python
  if (ext === '.py' || language === 'python') {
    return <FileCode size={ICON_SIZE} color="#3b8eea" style={baseStyle} />
  }
  // JavaScript
  if (ext === '.js' || language === 'javascript') {
    return <FileCode size={ICON_SIZE} color="#f1c40f" style={baseStyle} />
  }
  // TypeScript
  if (ext === '.ts') {
    return <FileCode size={ICON_SIZE} color="#3b8eea" style={baseStyle} />
  }
  // React
  if (ext === '.tsx' || ext === '.jsx') {
    return <FileCode size={ICON_SIZE} color="#61dafb" style={baseStyle} />
  }
  // C++
  if (ext === '.cpp' || ext === '.cc' || ext === '.cxx' || language === 'cpp') {
    return <FileCode size={ICON_SIZE} color="#9b59b6" style={baseStyle} />
  }
  // C
  if (ext === '.c' || language === 'c') {
    return <FileCode size={ICON_SIZE} color="#8e44ad" style={baseStyle} />
  }
  // Java
  if (ext === '.java' || language === 'java') {
    return <FileCode size={ICON_SIZE} color="#e74c3c" style={baseStyle} />
  }
  // Markdown
  if (ext === '.md' || language === 'markdown') {
    return <FileText size={ICON_SIZE} color="#4ecdc4" style={baseStyle} />
  }
  // JSON
  if (ext === '.json') {
    return <Braces size={ICON_SIZE} color="#f39c12" style={baseStyle} />
  }
  // HTML
  if (ext === '.html') {
    return <FileCode size={ICON_SIZE} color="#e67e22" style={baseStyle} />
  }
  // CSS
  if (ext === '.css') {
    return <FileCode size={ICON_SIZE} color="#2980b9" style={baseStyle} />
  }
  // Default (includes dot files like .gitignore / .env — rendered gray)
  return <File size={ICON_SIZE} color="#7f8c8d" style={baseStyle} />
}
