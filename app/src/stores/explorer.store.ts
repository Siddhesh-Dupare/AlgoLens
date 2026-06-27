import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FileNode } from '@/components/explorer/explorer.data'

export const useExplorerStore = defineStore('explorer', () => {
  const fileTree = ref<FileNode[]>([])
  const rootName = ref<string>('')
  let rootHandle: FileSystemDirectoryHandle | null = null

  // Read exactly one level of a directory (folders keep their handle for later).
  async function readDir(dir: FileSystemDirectoryHandle, basePath: string): Promise<FileNode[]> {
    const nodes: FileNode[] = []
    for await (const [name, handle] of dir.entries()) {
      const id = `${basePath}/${name}`
      if (handle.kind === 'directory') {
        nodes.push({
          id,
          name,
          type: 'folder',
          dirHandle: handle as FileSystemDirectoryHandle,
          children: [],
          loaded: false,
        })
      } else {
        nodes.push({ id, name, type: 'file', handle: handle as FileSystemFileHandle })
      }
    }
    // Folders first, then files; each alphabetical.
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }

  async function openFolder() {
    const dir = await window.showDirectoryPicker()
    rootHandle = dir
    rootName.value = dir.name
    // Only the top level is read up front — children load on demand.
    fileTree.value = await readDir(dir, dir.name)
  }

  // Load a folder's immediate children the first time it is expanded.
  async function loadChildren(node: FileNode) {
    if (node.type !== 'folder' || node.loaded || !node.dirHandle) return
    node.children = await readDir(node.dirHandle, node.id)
    node.loaded = true
  }

  // Re-read the root (collapses everything back to a fresh, lazy tree).
  async function refresh() {
    if (!rootHandle) return
    fileTree.value = await readDir(rootHandle, rootHandle.name)
  }

  return { fileTree, rootName, openFolder, loadChildren, refresh }
})
