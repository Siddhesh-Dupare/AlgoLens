import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Holds the captured IR frames for one Debug run and drives playback. Nothing is
// shown in the renderer until the user starts (play / step / seek).
export const usePlaybackStore = defineStore('playback', () => {
  const frames = ref<object[]>([])
  const lines = ref<number[]>([]) // source line per frame (for the editor highlight)
  const index = ref(0)
  const isPlaying = ref(false)
  const started = ref(false) // becomes true on the first play/step/seek
  const speed = ref(1) // playback speed multiplier
  let timer: number | undefined

  // Executing source line — only once playback has started.
  const currentLine = computed(() =>
    started.value ? (lines.value[index.value] ?? null) : null,
  )

  function pushFrame(payload: object) {
    if (window.cefQuery) {
      window.cefQuery({
        request: JSON.stringify(payload),
        onSuccess: () => {},
        onFailure: () => {},
      })
    }
  }

  function sendCurrent() {
    const f = frames.value[index.value]
    if (f) pushFrame(f)
  }

  // Blank the renderer (empty IR) — used before the user starts.
  function sendClear() {
    pushFrame({ version: 1, components: [] })
  }

  // Load a run's frames but show NOTHING until play/step/seek.
  function setFrames(items: { ir: object; line: number }[]) {
    pause()
    frames.value = items.map((it) => it.ir)
    lines.value = items.map((it) => it.line)
    index.value = 0
    started.value = false
    sendClear()
  }

  // First activation just reveals frame 0 (doesn't advance).
  function begin(): boolean {
    if (!started.value) {
      started.value = true
      sendCurrent()
      return true
    }
    return false
  }

  function stepForward() {
    if (begin()) return
    if (index.value < frames.value.length - 1) {
      index.value++
      sendCurrent()
    } else {
      pause()
    }
  }

  function stepBackward() {
    if (begin()) return
    if (index.value > 0) {
      index.value--
      sendCurrent()
    }
  }

  // Seek to a specific frame (the track / scrubber).
  function goTo(i: number) {
    if (frames.value.length === 0) return
    pause()
    started.value = true
    index.value = Math.max(0, Math.min(i, frames.value.length - 1))
    sendCurrent()
  }

  function play() {
    if (isPlaying.value || frames.value.length === 0) return
    started.value = true
    sendCurrent() // reveal the current frame immediately
    isPlaying.value = true
    timer = window.setInterval(() => {
      if (index.value >= frames.value.length - 1) {
        pause()
        return
      }
      index.value++
      sendCurrent()
    }, 600 / speed.value) // ms per frame, scaled by playback speed
  }

  // Playback speed multiplier (1x / 1.5x / 2x). Restarts the timer if playing.
  function setSpeed(s: number) {
    speed.value = s
    if (isPlaying.value) {
      pause()
      play()
    }
  }

  function pause() {
    isPlaying.value = false
    if (timer !== undefined) {
      clearInterval(timer)
      timer = undefined
    }
  }

  function togglePlay() {
    if (isPlaying.value) pause()
    else play()
  }

  return {
    frames,
    index,
    isPlaying,
    started,
    speed,
    currentLine,
    setFrames,
    stepForward,
    stepBackward,
    goTo,
    play,
    pause,
    togglePlay,
    setSpeed,
  }
})
