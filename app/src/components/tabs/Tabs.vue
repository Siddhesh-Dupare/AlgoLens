<script setup lang="ts">
import type { Component } from 'vue'
import { executionConfig } from './tab.data'
import { X, FileCode, FileText, Loader2 } from '@lucide/vue'
import { useTabsStore } from '@/stores/tabs.store'
import { useExecutionStore } from '@/stores/execution.store'
import { storeToRefs } from 'pinia'

const tabsStore = useTabsStore()
const { tabs, activeTabId } = storeToRefs(tabsStore)

const exec = useExecutionStore()
const { running, mode } = storeToRefs(exec)

const CODE_LANGS = new Set(['javascript', 'typescript', 'python', 'java', 'cpp', 'c'])
function iconFor(lang: string): Component {
  return CODE_LANGS.has(lang) ? FileCode : FileText
}
</script>

<template>
  <div
    class="flex h-9 select-none items-center justify-between border-b border-white/[0.08] bg-[#16181c]"
  >
    <div class="flex h-full flex-1 items-center overflow-x-auto">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="group relative flex h-full cursor-pointer items-center gap-2 border-r border-white/[0.05] px-3 text-[13px] transition-colors"
        :class="
          tab.id === activeTabId
            ? 'bg-[#1b1d22] text-zinc-100'
            : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200'
        "
        @click="tabsStore.setActiveTab(tab.id)"
      >
        <!-- active accent bar -->
        <span
          v-if="tab.id === activeTabId"
          class="absolute inset-x-0 top-0 h-0.5 bg-sky-500"
        />
        <component :is="iconFor(tab.language)" class="size-3.5 shrink-0 text-zinc-500" />
        <span class="max-w-[12rem] truncate">{{ tab.name }}</span>
        <X
          class="size-3.5 shrink-0 rounded text-zinc-500 transition-opacity hover:bg-white/10 hover:text-zinc-200"
          :class="tab.id === activeTabId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
          @click.stop="tabsStore.closeTab(tab.id)"
        />
      </div>
    </div>

    <!-- Run / Debug -->
    <div class="flex items-center gap-1 px-2">
      <button
        v-for="execution in executionConfig"
        :key="execution.id"
        class="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] disabled:opacity-50 disabled:hover:bg-transparent"
        :class="execution.id === 'run' ? 'hover:text-emerald-400' : 'hover:text-amber-400'"
        :disabled="running"
        :aria-label="execution.label"
        @click="execution.action?.()"
      >
        <Loader2
          v-if="running && mode === execution.id"
          class="size-3.5 animate-spin"
        />
        <component :is="execution.symbol" v-else class="size-3.5" />
        <span>{{ running && mode === execution.id ? 'Running…' : execution.label }}</span>
      </button>
    </div>
  </div>
</template>
