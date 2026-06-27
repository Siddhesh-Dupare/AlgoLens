import { defineStore } from 'pinia'
import { ref } from 'vue'

// Tracks whether a Run/Debug is in progress, so the buttons can show a spinner.
export const useExecutionStore = defineStore('execution', () => {
  const running = ref(false)
  const mode = ref<'run' | 'debug' | null>(null)

  function start(m: 'run' | 'debug') {
    running.value = true
    mode.value = m
  }

  function stop() {
    running.value = false
    mode.value = null
  }

  return { running, mode, start, stop }
})
