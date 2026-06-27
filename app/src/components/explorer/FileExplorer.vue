<script setup lang="ts">
import { FolderOpen, RefreshCw } from '@lucide/vue'
import ExplorerNode from './ExplorerNode.vue'
import { useExplorerStore } from '@/stores/explorer.store'
import { storeToRefs } from 'pinia'

const store = useExplorerStore()
const { fileTree, rootName } = storeToRefs(store)
</script>

<template>
  <div class="flex h-full flex-col bg-[#1b1d22] text-zinc-300">
    <!-- header -->
    <div
      class="group flex h-8 shrink-0 items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
    >
      <span class="truncate">{{ rootName || 'Explorer' }}</span>
      <div class="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          v-if="fileTree.length"
          class="rounded p-1 text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-100"
          title="Refresh"
          @click="store.refresh()"
        >
          <RefreshCw class="size-3.5" />
        </button>
        <button
          class="rounded p-1 text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-100"
          title="Open Folder"
          @click="store.openFolder()"
        >
          <FolderOpen class="size-3.5" />
        </button>
      </div>
    </div>

    <!-- empty state -->
    <div
      v-if="!fileTree.length"
      class="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center"
    >
      <p class="text-[13px] text-zinc-500">No folder is open yet.</p>
      <button
        class="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[13px] text-zinc-200 transition-colors hover:bg-white/[0.08]"
        @click="store.openFolder()"
      >
        Open Folder
      </button>
    </div>

    <div
      v-else
      class="algolens-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1 py-1"
    >
      <ExplorerNode v-for="node in fileTree" :key="node.id" :node="node" />
    </div>
  </div>
</template>
