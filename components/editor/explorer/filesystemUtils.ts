import type { FileNode, FileLanguage } from './explorer.types'

export function getLanguageFromFilename(name: string): FileLanguage {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  switch (ext) {
    case 'py':
      return 'python'
    case 'js':
    case 'jsx':
      return 'javascript'
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'c++':
      return 'cpp'
    case 'c':
      return 'c'
    case 'java':
      return 'java'
    case 'md':
    case 'markdown':
      return 'markdown'
    case 'json':
      return 'json'
    case 'html':
    case 'htm':
      return 'html'
    case 'css':
    case 'scss':
    case 'sass':
      return 'css'
    default:
      return 'unknown'
  }
}

export function getMonacoLanguage(language: FileLanguage): string {
  switch (language) {
    case 'python':
      return 'python'
    case 'javascript':
      return 'javascript'
    case 'typescript':
      return 'typescript'
    case 'cpp':
      return 'cpp'
    case 'c':
      return 'c'
    case 'java':
      return 'java'
    case 'markdown':
      return 'markdown'
    case 'json':
      return 'json'
    case 'html':
      return 'html'
    case 'css':
      return 'css'
    case 'unknown':
    case 'text':
    default:
      return 'plaintext'
  }
}

const ALWAYS_INCLUDED_DOTFILES = new Set([
  '.gitignore',
  '.env',
  '.env.local',
  '.prettierrc',
  '.eslintrc',
])

const EXCLUDED_NAMES = new Set([
  'node_modules',
  '__pycache__',
  '.next',
  'dist',
  'build',
  'out',
  '.git',
  'venv',
  '.venv',
  'env',
  '.idea',
  '.vscode',
  'coverage',
])

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '__pycache__',
  '.next',
  'dist',
  'build',
  'out',
  '.git',
  'venv',
  '.venv',
  'env',
  '.idea',
  '.vscode',
  'coverage',
  '.cache',
  'target',
  'bin',
  'obj',
])

export function shouldIncludeFile(name: string): boolean {
  if (EXCLUDED_NAMES.has(name)) return false
  if (name.endsWith('.pyc')) return false
  if (name.startsWith('.')) {
    return ALWAYS_INCLUDED_DOTFILES.has(name)
  }
  return true
}

export function shouldIncludeDirectory(name: string): boolean {
  return !EXCLUDED_DIRS.has(name)
}

export async function readDirectoryRecursive(
  dirHandle: FileSystemDirectoryHandle,
  parentId: string,
  depth: number = 0
): Promise<FileNode[]> {
  if (depth >= 6) return []

  const children: FileNode[] = []

  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === 'directory') {
      if (!shouldIncludeDirectory(name)) continue
      const id = parentId + '/' + name
      const subChildren = await readDirectoryRecursive(
        handle as FileSystemDirectoryHandle,
        id,
        depth + 1
      )
      children.push({
        id,
        name,
        type: 'folder',
        dirHandle: handle as FileSystemDirectoryHandle,
        children: subChildren,
        isLoaded: true,
      })
    } else {
      if (!shouldIncludeFile(name)) continue
      const id = parentId + '/' + name
      children.push({
        id,
        name,
        type: 'file',
        language: getLanguageFromFilename(name),
        handle: handle as FileSystemFileHandle,
        isLoaded: true,
      })
    }
  }

  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  })

  return children
}

export async function readFileContent(
  handle: FileSystemFileHandle
): Promise<string> {
  try {
    const file = await handle.getFile()
    if (file.size > 5 * 1024 * 1024) {
      return '// File too large to display (> 5MB)'
    }
    return await file.text()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return '// Could not read file: ' + message
  }
}

export async function openFolder(): Promise<{
  name: string
  handle: FileSystemDirectoryHandle
  children: FileNode[]
} | null> {
  try {
    const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
    const children = await readDirectoryRecursive(dirHandle, dirHandle.name, 0)
    return {
      name: dirHandle.name,
      handle: dirHandle,
      children,
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return null
    }
    console.error('Failed to open folder:', err)
    return null
  }
}
