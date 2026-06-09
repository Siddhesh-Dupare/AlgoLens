export interface TabItem {
  id: string
  name: string
  language: string
  content: string
  /** Disk handle. Absent for untitled (in-memory) tabs created via New File. */
  handle?: FileSystemFileHandle
  isDirty: boolean
  /** Last content written to disk (or loaded). isDirty === (content !== savedContent). */
  savedContent: string
  /** True for an in-memory "Untitled-N" buffer that has no disk handle yet. */
  isUntitled?: boolean
  /** True once an untitled buffer has been saved (persisted to localStorage). */
  savedToLocal?: boolean
}
