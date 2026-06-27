<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Play, Pause, SkipBack, SkipForward } from '@lucide/vue'
import { usePlaybackStore } from '@/stores/playback.store'

const pb = usePlaybackStore()
const vizPanel = ref<HTMLElement | null>(null)

const hasFrames = computed(() => pb.frames.length > 0)
const seekPct = computed(() => {
  const n = pb.frames.length
  return n > 1 ? (pb.index / (n - 1)) * 100 : 0
})
const status = computed(() =>
  pb.isPlaying ? 'Playing' : pb.started ? 'Paused' : 'Ready',
)

const SPEEDS = [1, 1.5, 2]
function cycleSpeed() {
  const i = SPEEDS.indexOf(pb.speed)
  pb.setSpeed(SPEEDS[(i + 1) % SPEEDS.length] ?? 1)
}

function query(payload: object) {
  const cefQuery = (window as any).cefQuery
  if (!cefQuery) return
  cefQuery({ request: JSON.stringify(payload), onSuccess: () => {}, onFailure: () => {} })
}

// Show the renderer at the panel's current rectangle (the flex-1 area only, so
// the controls bar below is never covered by the native window).
function sendBounds() {
  if (!vizPanel.value) return
  const r = vizPanel.value.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  query({
    type: 'bounds',
    x: Math.round(r.left * dpr),
    y: Math.round(r.top * dpr),
    w: Math.round(r.width * dpr),
    h: Math.round(r.height * dpr),
  })
}

function hideRenderer() {
  query({ type: 'bounds', x: 0, y: 0, w: 0, h: 0 })
}

let settleTimer: number | undefined
let hidden = false

function onResize() {
  if (!hidden) {
    hideRenderer()
    hidden = true
  }
  clearTimeout(settleTimer)
  settleTimer = window.setTimeout(() => {
    hidden = false
    sendBounds()
  }, 120)
}

let ro: ResizeObserver | undefined
let firstObserve = true
let timers: number[] = []

onMounted(() => {
  sendBounds()
  timers = [300, 800, 1500, 3000].map((t) => window.setTimeout(sendBounds, t))

  ro = new ResizeObserver(() => {
    if (firstObserve) {
      firstObserve = false
      return
    }
    onResize()
  })
  if (vizPanel.value) ro.observe(vizPanel.value)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  timers.forEach(clearTimeout)
  clearTimeout(settleTimer)
  ro?.disconnect()
  window.removeEventListener('resize', onResize)
  hideRenderer() // hide the docked renderer when the panel closes
})
</script>

<template>
  <div class="flex h-full w-full flex-col bg-[#0a0a0c]">
    <!-- header -->
    <div
      class="flex h-8 shrink-0 items-center justify-between border-b border-white/[0.06] px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
    >
      <span>Visualizer</span>
      <span
        class="flex items-center gap-1.5 text-[10px] normal-case tracking-normal"
        :class="pb.isPlaying ? 'text-emerald-400' : 'text-zinc-500'"
      >
        <span class="size-1.5 rounded-full" :class="pb.isPlaying ? 'bg-emerald-400' : 'bg-zinc-600'" />
        {{ status }}
      </span>
    </div>

    <!-- The docked SDL renderer overlays THIS area only. -->
    <div ref="vizPanel" class="min-h-0 flex-1"></div>

    <!-- Playback controls — below the renderer, never covered. -->
    <div class="flex shrink-0 flex-col gap-2.5 border-t border-white/[0.08] bg-[#16181c] px-3 py-3">
      <!-- Seek track (filled progress, music-player style). -->
      <input
        type="range"
        class="viz-seek w-full"
        :style="{ '--pct': seekPct + '%' }"
        :min="0"
        :max="Math.max(0, pb.frames.length - 1)"
        :value="pb.index"
        :disabled="!hasFrames"
        @input="pb.goTo(Number(($event.target as HTMLInputElement).value))"
      />

      <!-- Transport row: line | transport | speed + counter -->
      <div class="grid grid-cols-3 items-center">
        <div class="justify-self-start text-[11px] tabular-nums text-zinc-500">
          <span v-if="pb.currentLine != null">Ln {{ pb.currentLine }}</span>
        </div>

        <div class="flex items-center justify-center gap-2 justify-self-center">
          <button
            class="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
            :disabled="!hasFrames"
            title="Step back"
            @click="pb.stepBackward()"
          >
            <SkipBack :size="16" />
          </button>

          <button
            class="flex size-8 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/20 transition-colors hover:bg-sky-400 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:shadow-none"
            :disabled="!hasFrames"
            :title="pb.isPlaying ? 'Pause' : 'Play'"
            @click="pb.togglePlay()"
          >
            <Pause v-if="pb.isPlaying" :size="15" class="fill-current" />
            <Play v-else :size="15" class="fill-current" />
          </button>

          <button
            class="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
            :disabled="!hasFrames"
            title="Step forward"
            @click="pb.stepForward()"
          >
            <SkipForward :size="16" />
          </button>
        </div>

        <div class="flex items-center gap-2 justify-self-end">
          <button
            class="rounded px-1.5 py-0.5 text-[11px] tabular-nums text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-zinc-100"
            title="Playback speed"
            @click="cycleSpeed"
          >
            {{ pb.speed }}×
          </button>
          <span class="text-[11px] tabular-nums text-zinc-500">
            {{ pb.started ? pb.index + 1 : 0 }} / {{ pb.frames.length }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.viz-seek {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 9999px;
  cursor: pointer;
  background: linear-gradient(
    to right,
    #0ea5e9 var(--pct, 0%),
    rgba(255, 255, 255, 0.12) var(--pct, 0%)
  );
}
.viz-seek::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  background: #ffffff;
  border: 2px solid #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.18);
  transition: transform 0.1s ease;
}
.viz-seek::-webkit-slider-thumb:hover {
  transform: scale(1.18);
}
.viz-seek:disabled {
  cursor: default;
  opacity: 0.4;
}
.viz-seek:disabled::-webkit-slider-thumb {
  box-shadow: none;
}
</style>
