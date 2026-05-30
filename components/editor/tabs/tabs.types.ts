export interface TabItem {
  id: string
  name: string
  language: string
  content: string
  handle: FileSystemFileHandle
  isDirty: boolean
  /** Last content written to disk (or loaded). isDirty === (content !== savedContent). */
  savedContent: string
}
