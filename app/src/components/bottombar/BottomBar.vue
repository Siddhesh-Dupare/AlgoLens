<script setup lang="ts">
import { stripLeftConfig, stripRightConfig, languageLabels } from './bottom.bar'

import { useLayoutStore } from '@/stores/layout.store'
import { useTabsStore } from '@/stores/tabs.store'
import { storeToRefs } from 'pinia'

const layout = useLayoutStore()
const { explorerVisible, terminalVisible, visualizerVisible } = storeToRefs(layout)

const tabsStore = useTabsStore()
const { activeTab } = storeToRefs(tabsStore)

function getPressedState(id: string): boolean {
  if (id === 'tree-list') return explorerVisible.value
  if (id === 'terminal-panel') return terminalVisible.value
  if (id === 'visualizer-panel') return visualizerVisible.value
  return false
}

const itemClass =
  'flex h-full items-center gap-1.5 px-2.5 text-zinc-400 transition-colors ' +
  'hover:bg-white/[0.06] hover:text-zinc-200 cursor-pointer'
const activeClass = 'bg-white/[0.06] text-zinc-100'
</script>

<template>
  <div
    class="flex h-[26px] select-none items-center justify-between border-t border-white/[0.08] bg-[#1b1d22] text-[11px] text-zinc-400"
  >
    <!-- left strip -->
    <div class="flex h-full items-center">
      <button
        v-for="item in stripLeftConfig"
        :key="item.id"
        :class="[itemClass, getPressedState(item.id) ? activeClass : '']"
        :aria-label="item.label"
        @click="item.action?.()"
      >
        <component :is="item.symbol" class="size-3.5" />
        <span>{{ item.label }}</span>
      </button>
    </div>

    <!-- right strip -->
    <div class="flex h-full items-center">
      <span v-if="activeTab" class="px-2 text-zinc-400">
        {{ languageLabels[activeTab.language] ?? activeTab.language }}
      </span>
      <button
        v-for="item in stripRightConfig"
        :key="item.id"
        :class="[itemClass, getPressedState(item.id) ? activeClass : '']"
        :aria-label="item.label"
        @click="item.action?.()"
      >
        <component :is="item.symbol" class="size-3.5" />
        <span>{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>
