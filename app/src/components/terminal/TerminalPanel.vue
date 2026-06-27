<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import TerminalTabs from './TerminalTabs.vue'
import TerminalInstance from './TerminalInstance.vue'
import { useTerminalStore } from '@/stores/terminal.store'
import { useServerStore } from '@/stores/server.store'
import { useLayoutStore } from '@/stores/layout.store'
import { storeToRefs } from 'pinia'

const store = useTerminalStore()
const server = useServerStore()
const layout = useLayoutStore()
const { sessions, activeSessionId } = storeToRefs(store)
const { terminalVisible } = storeToRefs(layout)

const instanceRefs = ref<Record<string, InstanceType<typeof TerminalInstance>>>({})

// Open a shell whenever the terminal becomes visible with no sessions (so it
// reopens cleanly after auto-closing, and spawns no pty while hidden).
watch(
  terminalVisible,
  async (visible) => {
    if (visible && sessions.value.length === 0) {
      if (!store.availableShells.length) await store.fetchShells()
      store.createSession()
    }
  },
  { immediate: true },
)

onMounted(() => {
  server.onMessage((msg) => {
    const active = activeSessionId.value
    if (!active) return
    const term = instanceRefs.value[active]
    if (!term) return

    if (msg.type === 'output') {
      term.write(msg.text.replace(/\n/g, '\r\n')) // xterm needs \r\n
    } else if (msg.type === 'error') {
      term.write(`\r\n\x1b[31m[${msg.errorType}] ${msg.message}\x1b[0m\r\n`)
    } else if (msg.type === 'complete') {
      term.write(`\r\n\x1b[90m[exited ${msg.exitCode} in ${msg.durationMs}ms]\x1b[0m\r\n`)
    }
  })
})
</script>

<template>
  <div class="h-full flex flex-col">
    <TerminalTabs />
    <div class="flex-1 relative">
      <TerminalInstance
        v-for="session in sessions"
        :key="session.id"
        :ref="
          (el) => {
            if (el) instanceRefs[session.id] = el as any
          }
        "
        v-show="session.id === activeSessionId"
        :session-id="session.id"
        :shell="session.shell"
        class="absolute inset-0"
      />
    </div>
  </div>
</template>
