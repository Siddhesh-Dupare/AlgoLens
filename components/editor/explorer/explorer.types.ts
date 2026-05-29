export type FileLanguage =
  | 'python'
  | 'javascript'
  | 'cpp'
  | 'c'
  | 'java'
  | 'markdown'
  | 'text'

export type FileNodeType = 'file' | 'folder'

export interface FileNode {
  id: string
  name: string
  type: FileNodeType
  language?: FileLanguage
  content?: string
  children?: FileNode[]
}

export interface ExplorerState {
  selectedId: string | null
  expandedIds: Set<string>
}
