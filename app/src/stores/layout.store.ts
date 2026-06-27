import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  const explorerVisible = ref(true)
  const terminalVisible = ref(false)
  const visualizerVisible = ref(true)

  function toggleExplorer() {
    explorerVisible.value = !explorerVisible.value
  }

  function toggleTerminal() {
    terminalVisible.value = !terminalVisible.value
  }

  function toggleVisualizer() {
    visualizerVisible.value = !visualizerVisible.value
  }

  return {
    explorerVisible,
    toggleExplorer,
    terminalVisible,
    toggleTerminal,
    visualizerVisible,
    toggleVisualizer,
  }
})
