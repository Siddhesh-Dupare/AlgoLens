export interface TabItem {
  id: string
  name: string
  language: string
  content: string
  handle: FileSystemFileHandle
  isDirty: boolean
}
