// Minimal view of the active Monaco editor, so menu items / shortcuts can drive
// editor commands without importing the heavy monaco module here.
type EditorLike = {
  focus(): void
  trigger(source: string | null | undefined, handlerId: string, payload?: unknown): void
  getAction(id: string): { run(): unknown } | null
}

let active: EditorLike | null = null

export function setActiveEditor(editor: EditorLike | null) {
  active = editor
}

// Run a registered Monaco action (e.g. 'editor.action.clipboardCopyAction').
export function runEditorAction(id: string) {
  if (!active) return
  active.focus()
  active.getAction(id)?.run()
}

// Trigger a built-in handler (used for undo / redo).
export function triggerEditor(handlerId: string) {
  if (!active) return
  active.focus()
  active.trigger('menu', handlerId, null)
}
