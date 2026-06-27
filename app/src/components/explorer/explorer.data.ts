import type { Component } from 'vue'

export type FileNode = {
  id: string // unique full path, e.g. "project/src/main.py"
  name: string
  type: 'file' | 'folder'
  icon?: Component
  children?: FileNode[]
  handle?: FileSystemFileHandle
  // Folders keep their directory handle and load their children lazily (on first
  // expand) so opening a project is instant even for huge trees.
  dirHandle?: FileSystemDirectoryHandle
  loaded?: boolean
}
