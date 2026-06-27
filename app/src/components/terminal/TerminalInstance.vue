<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { notifyError } from '@/lib/notify'

const props = defineProps<{ sessionId: string; shell?: string }>()

const container = ref<HTMLDivElement>()
let terminal: Terminal
let fitAddon: FitAddon
let webSocket: WebSocket
let resizeObserver: ResizeObserver
let resizeTimer: ReturnType<typeof setTimeout>

onMounted(() => {
  terminal = new Terminal({
    cursorBlink: true,
    cursorStyle: 'bar',
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
    lineHeight: 1.35,
    letterSpacing: 0.2,
    scrollback: 5000,
    theme: {
      background: '#1b1d22',
      foreground: '#c5c9d2',
      cursor: '#61afef',
      cursorAccent: '#1b1d22',
      selectionBackground: '#3e4a5f',
      black: '#1b1d22',
      red: '#e06c75',
      green: '#98c379',
      yellow: '#d19a66',
      blue: '#61afef',
      magenta: '#c792ea',
      cyan: '#56b6c2',
      white: '#abb2bf',
      brightBlack: '#5c6370',
      brightRed: '#e06c75',
      brightGreen: '#98c379',
      brightYellow: '#e5c07b',
      brightBlue: '#61afef',
      brightMagenta: '#c792ea',
      brightCyan: '#56b6c2',
      brightWhite: '#ffffff',
    },
  })
  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.open(container.value!)
  fitAddon.fit()

  webSocket = new WebSocket('ws://127.0.0.1:3002')

  webSocket.onopen = () =>
    webSocket.send(
      JSON.stringify({
        type: 'init',
        sessionId: props.sessionId,
        shell: props.shell,
        cols: terminal.cols,
        rows: terminal.rows,
      }),
    )

  webSocket.onmessage = (e) => {
    if (typeof e.data === 'string') terminal.write(e.data)
    else terminal.write(new Uint8Array(e.data))
  }

  webSocket.onerror = () =>
    notifyError(
      'Terminal server unavailable',
      'Could not reach the terminal server on port 3002.',
      'terminal-3002',
    )

  terminal.onData((data) => {
    if (webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify({ type: 'input', sessionId: props.sessionId, data }))
    }
  })

  const doFit = () => {
    fitAddon.fit()
    if (webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(
        JSON.stringify({
          type: 'resize',
          sessionId: props.sessionId,
          cols: terminal.cols,
          rows: terminal.rows,
        }),
      )
    }
  }

  resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(doFit, 50)
  })
  resizeObserver.observe(container.value!)
})

onUnmounted(() => {
  clearTimeout(resizeTimer)
  resizeObserver?.disconnect()
  webSocket?.send(JSON.stringify({ type: 'close', sessionId: props.sessionId }))
  webSocket?.close()
  terminal?.dispose()
})

defineExpose({
  write: (text: string) => terminal?.write(text),
})
</script>

<template>
  <div ref="container" class="h-full w-full bg-[#1b1d22] px-2 py-1"></div>
</template>

<style scoped>
:deep(.xterm) {
  padding: 0;
  height: 100%;
}
:deep(.xterm-viewport) {
  border-radius: 0;
}
</style>
