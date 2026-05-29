export {}

declare global {
  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<
      [string, FileSystemFileHandle | FileSystemDirectoryHandle]
    >
    values(): AsyncIterableIterator<
      FileSystemFileHandle | FileSystemDirectoryHandle
    >
    keys(): AsyncIterableIterator<string>
  }

  interface Window {
    showDirectoryPicker(options?: {
      mode?: 'read' | 'readwrite'
    }): Promise<FileSystemDirectoryHandle>
  }
}
