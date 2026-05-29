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
  language?: FileLanguage
  handle?: FileSystemFileHandle
  dirHandle?: FileSystemDirectoryHandle
  children?: FileNode[]
  isLoaded?: boolean
}

export interface OpenedTab {
  id: string
  name: string
  language: FileLanguage
  content: string
  handle: FileSystemFileHandle
  isDirty: boolean
}
