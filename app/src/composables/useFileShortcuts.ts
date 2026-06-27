import { onMounted, onUnmounted } from 'vue'
import { newFile, openFile, save, saveAs, closeActiveTab } from '@/components/menubar/file.actions'

// Wires the File-menu accelerators globally so the shortcuts shown in the menu
// actually work. Capture phase so we intercept before the editor.
export function useFileShortcuts() {
  function onKey(e: KeyboardEvent) {
    if (!e.ctrlKey && !e.metaKey) return
    const k = e.key.toLowerCase()

    if (k === 's' && e.shiftKey) {
      e.preventDefault()
      void saveAs()
    } else if (k === 's') {
      e.preventDefault()
      void save()
    } else if (k === 'o') {
      e.preventDefault()
      void openFile()
    } else if (k === 'n') {
      e.preventDefault()
      newFile()
    } else if (k === 'w') {
      e.preventDefault()
      closeActiveTab()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKey, true))
  onUnmounted(() => window.removeEventListener('keydown', onKey, true))
}
