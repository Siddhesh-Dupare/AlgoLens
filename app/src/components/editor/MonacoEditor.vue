<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type * as Monaco from 'monaco-editor'
import { usePlaybackStore } from '@/stores/playback.store'
import { setActiveEditor } from '@/lib/editorRegistry'

const props = defineProps<{
  modelValue: string
  language?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const pb = usePlaybackStore()
const container = ref<HTMLDivElement>()
let editor: Monaco.editor.IStandaloneCodeEditor | undefined
let monacoRef: typeof Monaco | undefined
let decorations: Monaco.editor.IEditorDecorationsCollection | undefined

onMounted(async () => {
  await import('./monaco-setup')
  const monaco = await import('monaco-editor')
  monacoRef = monaco

  // A custom theme on the app's editor-chrome background (#1b1d22) with a clean,
  // modern (One Dark-ish) syntax palette.
  monaco.editor.defineTheme('algolens-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'c5c9d2' },
      { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c792ea' },
      { token: 'keyword.control', foreground: 'c792ea' },
      { token: 'string', foreground: '98c379' },
      { token: 'number', foreground: 'd19a66' },
      { token: 'regexp', foreground: '56b6c2' },
      { token: 'type', foreground: '56b6c2' },
      { token: 'type.identifier', foreground: 'e5c07b' },
      { token: 'function', foreground: '61afef' },
      { token: 'variable', foreground: 'e06c75' },
      { token: 'variable.predefined', foreground: 'd19a66' },
      { token: 'constant', foreground: 'd19a66' },
      { token: 'operator', foreground: '56b6c2' },
      { token: 'delimiter', foreground: 'abb2bf' },
      { token: 'tag', foreground: 'e06c75' },
      { token: 'attribute.name', foreground: 'd19a66' },
    ],
    colors: {
      'editor.background': '#1b1d22',
      'editor.foreground': '#c5c9d2',
      'editorLineNumber.foreground': '#4b5263',
      'editorLineNumber.activeForeground': '#9da5b4',
      'editor.lineHighlightBackground': '#ffffff08',
      'editor.lineHighlightBorder': '#00000000',
      'editor.selectionBackground': '#3e4a5f',
      'editor.inactiveSelectionBackground': '#3e4a5f80',
      'editorCursor.foreground': '#61afef',
      'editorIndentGuide.background1': '#ffffff10',
      'editorIndentGuide.activeBackground1': '#ffffff2a',
      'editorGutter.background': '#1b1d22',
      'editorWidget.background': '#1f2127',
      'editorWidget.border': '#ffffff1a',
      'editorSuggestWidget.background': '#1f2127',
      'editorSuggestWidget.border': '#ffffff1a',
      'editorSuggestWidget.selectedBackground': '#ffffff14',
      'editorHoverWidget.background': '#1f2127',
      'editorBracketMatch.background': '#ffffff14',
      'editorBracketMatch.border': '#ffffff33',
      'scrollbarSlider.background': '#ffffff14',
      'scrollbarSlider.hoverBackground': '#ffffff26',
      'scrollbarSlider.activeBackground': '#ffffff33',
      'editorWhitespace.foreground': '#ffffff14',
    },
  })

  editor = monaco.editor.create(container.value!, {
    value: props.modelValue,
    language: props.language ?? 'plaintext',
    theme: 'algolens-dark',
    automaticLayout: true,
    glyphMargin: true, // for the current-line ▶ marker
    fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace",
    fontLigatures: true,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.3,
    fontWeight: '450',
    padding: { top: 14, bottom: 14 },
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    cursorWidth: 2,
    roundedSelection: true,
    renderLineHighlight: 'all',
    renderWhitespace: 'selection',
    guides: { indentation: true, bracketPairs: true, highlightActiveIndentation: true },
    bracketPairColorization: { enabled: true },
    scrollbar: {
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
      useShadows: false,
    },
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    fixedOverflowWidgets: true,
    tabSize: 4,
  })

  decorations = editor.createDecorationsCollection()
  setActiveEditor(editor) // expose to the menu bar / shortcuts

  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor!.getValue())
  })
})

// Highlight the line currently executing during debug playback, and scroll to it.
watch(
  () => pb.currentLine,
  (line) => {
    if (!editor || !decorations || !monacoRef) return
    if (line == null) {
      decorations.clear()
      return
    }
    decorations.set([
      {
        range: new monacoRef.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: 'debug-current-line',
          glyphMarginClassName: 'debug-current-line-glyph',
        },
      },
    ])
    editor.revealLineInCenter(line)
  },
)

watch(
  () => props.modelValue,
  (newValue) => {
    if (editor && newValue !== editor.getValue()) {
      editor.setValue(newValue)
    }
  },
)

onUnmounted(() => {
  setActiveEditor(null)
  editor?.dispose()
})
</script>

<template>
  <div ref="container" class="h-full w-full bg-[#1b1d22]" />
</template>

<!-- Unscoped: Monaco renders decorations outside this component's DOM scope. -->
<style>
.debug-current-line {
  background: rgba(245, 158, 11, 0.1);
  box-shadow: inset 2px 0 0 #f59e0b;
}
.debug-current-line-glyph::before {
  content: '▶';
  color: #f59e0b;
  margin-left: 4px;
}
</style>
