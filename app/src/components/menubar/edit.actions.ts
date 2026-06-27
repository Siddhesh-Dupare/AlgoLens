import { runEditorAction, triggerEditor } from '@/lib/editorRegistry'

// Edit menu — dispatched into the active Monaco editor.
export const editActions = {
  undo: () => triggerEditor('undo'),
  redo: () => triggerEditor('redo'),
  cut: () => runEditorAction('editor.action.clipboardCutAction'),
  copy: () => runEditorAction('editor.action.clipboardCopyAction'),
  paste: () => runEditorAction('editor.action.clipboardPasteAction'),
  find: () => runEditorAction('actions.find'),
  replace: () => runEditorAction('editor.action.startFindReplaceAction'),
}

// Selection menu.
export const selectionActions = {
  selectAll: () => runEditorAction('editor.action.selectAll'),
  expand: () => runEditorAction('editor.action.smartSelect.expand'),
  shrink: () => runEditorAction('editor.action.smartSelect.shrink'),
  copyLineUp: () => runEditorAction('editor.action.copyLinesUpAction'),
  copyLineDown: () => runEditorAction('editor.action.copyLinesDownAction'),
}
