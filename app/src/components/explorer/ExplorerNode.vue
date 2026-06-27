<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronRight, Folder, FolderOpen, FileCode, FileText, Loader2 } from '@lucide/vue'
import type { FileNode } from './explorer.data'
import { useTabsStore } from '@/stores/tabs.store'
import { useExplorerStore } from '@/stores/explorer.store'

const props = defineProps<{ node: FileNode; depth?: number }>()

const tabsStore = useTabsStore()
const explorer = useExplorerStore()

const open = ref(false)
const loading = ref(false)
const depth = props.depth ?? 0
const indent = depth * 12 + 4

const languageMap: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  java: 'java',
  c: 'cpp',
  cpp: 'cpp',
  cc: 'cpp',
  py: 'python',
}

const CODE_EXT = new Set([
  'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cc', 'h', 'hpp',
  'go', 'rs', 'rb', 'php', 'cs', 'vue', 'html', 'css', 'json', 'sh',
])

const ext = computed(() => props.node.name.split('.').pop()?.toLowerCase() ?? '')
const fileIcon = computed(() => (CODE_EXT.has(ext.value) ? FileCode : FileText))
const isActive = computed(
  () => props.node.type === 'file' && tabsStore.activeTabId === props.node.id,
)

async function toggle() {
  open.value = !open.value
  if (open.value && props.node.type === 'folder' && !props.node.loaded) {
    loading.value = true
    await explorer.loadChildren(props.node)
    loading.value = false
  }
}

async function openFile() {
  const file = await props.node.handle?.getFile()
  const content = file ? await file.text() : ''
  tabsStore.openTab({
    id: props.node.id,
    name: props.node.name,
    language: languageMap[ext.value] ?? 'plaintext',
    content,
    handle: props.node.handle,
  })
}

const rowClass =
  'group flex h-[22px] w-full items-center gap-1.5 rounded-[3px] pr-2 text-[13px] ' +
  'text-zinc-300 transition-colors hover:bg-white/[0.06] cursor-pointer'
</script>

<template>
  <!-- FOLDER -->
  <template v-if="node.type === 'folder'">
    <button :class="rowClass" :style="{ paddingLeft: `${indent}px` }" @click="toggle">
      <Loader2 v-if="loading" class="size-3.5 shrink-0 animate-spin text-zinc-500" />
      <ChevronRight
        v-else
        class="size-3.5 shrink-0 text-zinc-500 transition-transform duration-150"
        :class="open ? 'rotate-90' : ''"
      />
      <FolderOpen v-if="open" class="size-4 shrink-0 text-zinc-400" />
      <Folder v-else class="size-4 shrink-0 text-zinc-400" />
      <span class="truncate">{{ node.name }}</span>
    </button>

    <div v-if="open">
      <ExplorerNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
      />
    </div>
  </template>

  <!-- FILE -->
  <button
    v-else
    :class="[rowClass, isActive ? 'bg-white/[0.1] text-zinc-50 hover:bg-white/[0.1]' : '']"
    :style="{ paddingLeft: `${indent}px` }"
    @click="openFile"
  >
    <span class="size-3.5 shrink-0" />
    <component :is="fileIcon" class="size-4 shrink-0 text-zinc-500" />
    <span class="truncate">{{ node.name }}</span>
  </button>
</template>
