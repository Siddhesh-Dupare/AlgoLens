export type FileLanguage =
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'cpp'
  | 'c'
  | 'java'
  | 'markdown'
  | 'json'
  | 'html'
  | 'css'
  | 'text'
  | 'unknown'

export type FileNodeType = 'file' | 'folder'

export interface FileNode {
  id: string
  name: string
  type: FileNodeType
  parentId?: string
  language?: FileLanguage
  handle?: FileSystemFileHandle
  dirHandle?: FileSystemDirectoryHandle
  children?: FileNode[]
  isLoaded?: boolean
  /** True for a freshly created placeholder node awaiting its name. */
  isNew?: boolean
}

export interface ContextMenuState {
  isOpen: boolean
  x: number
  y: number
  node: FileNode | null
}

export interface NewInputState {
  isActive: boolean
  parentId: string | null
  type: 'file' | 'folder'
  depth: number
}

export interface OpenedTab {
  id: string
  name: string
  language: FileLanguage
  content: string
  handle: FileSystemFileHandle
  isDirty: boolean
}
