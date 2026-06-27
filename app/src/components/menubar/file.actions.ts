import { useTabsStore } from '@/stores/tabs.store'
import { useExplorerStore } from '@/stores/explorer.store'
import { notifyError, notifySuccess } from '@/lib/notify'

const LANG: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  java: 'java',
  c: 'cpp',
  cpp: 'cpp',
  cc: 'cpp',
  h: 'cpp',
  hpp: 'cpp',
  txt: 'plaintext',
}

export function detectLanguage(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return LANG[ext] ?? 'plaintext'
}

// The user cancelling a file picker throws AbortError — that's not an error.
function isAbort(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError'
}

export function newFile() {
  useTabsStore().openTab({
    id: crypto.randomUUID(),
    name: 'untitled.py',
    language: 'python',
    content: '',
  })
}

export async function openFile() {
  try {
    const [handle] = await window.showOpenFilePicker()
    const file = await handle.getFile()
    const content = await file.text()
    useTabsStore().openTab({
      id: `file:${handle.name}`,
      name: handle.name,
      language: detectLanguage(handle.name),
      content,
      handle,
    })
  } catch (e) {
    if (!isAbort(e)) notifyError('Could not open file', String((e as Error)?.message ?? e))
  }
}

export function openFolder() {
  return useExplorerStore().openFolder()
}

export async function save() {
  const tabs = useTabsStore()
  const tab = tabs.activeTab
  if (!tab) return
  if (!tab.handle) return saveAs() // untitled -> Save As
  try {
    const writable = await tab.handle.createWritable()
    await writable.write(tab.content)
    await writable.close()
    notifySuccess('Saved', tab.name)
  } catch (e) {
    if (!isAbort(e)) notifyError('Save failed', String((e as Error)?.message ?? e))
  }
}

export async function saveAs() {
  const tabs = useTabsStore()
  const tab = tabs.activeTab
  if (!tab) return
  try {
    const handle = await window.showSaveFilePicker({ suggestedName: tab.name })
    const writable = await handle.createWritable()
    await writable.write(tab.content)
    await writable.close()
    tabs.updateTab(tab.id, {
      handle,
      name: handle.name,
      language: detectLanguage(handle.name),
    })
    notifySuccess('Saved', handle.name)
  } catch (e) {
    if (!isAbort(e)) notifyError('Save failed', String((e as Error)?.message ?? e))
  }
}

export async function saveAll() {
  const tabs = useTabsStore()
  let saved = 0
  for (const tab of tabs.tabs) {
    if (!tab.handle) continue
    try {
      const writable = await tab.handle.createWritable()
      await writable.write(tab.content)
      await writable.close()
      saved++
    } catch {
      // skip files that fail; reported below in aggregate
    }
  }
  notifySuccess('Save All', `${saved} file(s) saved`)
}

export function closeActiveTab() {
  const tabs = useTabsStore()
  if (tabs.activeTabId) tabs.closeTab(tabs.activeTabId)
}
