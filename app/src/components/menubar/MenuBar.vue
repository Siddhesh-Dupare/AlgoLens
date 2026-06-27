<script setup lang="ts">
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarShortcut,
  MenubarSeparator,
} from '@/components/ui/menubar'

import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { menuConfig } from './menu.data'
import { windowConfig, sendWindowCommand } from './menu.cef'
import { installUpdate } from './external'
import { useUpdateStore } from '@/stores/update.store'

const updateStore = useUpdateStore()
const { available: updateAvailable, latest, installerUrl, releaseUrl } = storeToRefs(updateStore)

onMounted(() => updateStore.check())

function onUpdateClick() {
  installUpdate(installerUrl.value, releaseUrl.value)
}

// Zed-like editor chrome. Explicit dark colours so the title bar reads as
// "editor", independent of the app's light theme (the rest comes later).
const triggerClass =
  'cursor-pointer rounded-md px-2.5 py-1 text-[13px] font-medium text-zinc-400 ' +
  'transition-colors hover:bg-white/[0.07] hover:text-zinc-100 ' +
  'data-[state=open]:bg-white/[0.1] data-[state=open]:text-zinc-100'
const contentClass =
  'min-w-[14rem] rounded-lg border border-white/10 bg-[#1f2127] p-1 ' +
  'text-zinc-300 shadow-xl shadow-black/40'
const itemClass =
  'cursor-pointer rounded-md px-2.5 py-1.5 text-[13px] text-zinc-300 ' +
  'focus:bg-white/[0.08] focus:text-zinc-50'
const shortcutClass = 'ml-auto pl-6 text-[11px] tracking-wide text-zinc-500'
const sepClass = 'my-1 bg-white/[0.08]'
</script>

<template>
  <div
    class="flex h-9 select-none items-center justify-between border-b border-white/[0.08] bg-[#1b1d22] pl-2"
    style="-webkit-app-region: drag"
  >
    <!-- Brand + menus -->
    <div class="flex items-center gap-1" style="-webkit-app-region: no-drag">
      <span class="px-2 text-[13px] font-semibold tracking-tight text-zinc-100">AlgoLens</span>
      <Menubar class="h-auto gap-0.5 border-0 bg-transparent p-0 shadow-none">
        <MenubarMenu v-for="menu in menuConfig" :key="menu.trigger">
          <MenubarTrigger :class="triggerClass">{{ menu.trigger }}</MenubarTrigger>
          <MenubarContent :class="contentClass" align="start" :side-offset="6">
            <template v-for="(item, i) in menu.items" :key="i">
              <MenubarSeparator v-if="item.type === 'separator'" :class="sepClass" />
              <MenubarItem v-else :class="itemClass" @click="item.action?.()">
                {{ item.label }}
                <MenubarShortcut v-if="item.shortcut" :class="shortcutClass">
                  {{ item.shortcut }}
                </MenubarShortcut>
              </MenubarItem>
            </template>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>

    <!-- Right side: update notifier + account + window controls -->
    <div class="flex items-center" style="-webkit-app-region: no-drag">
      <button
        v-if="updateAvailable"
        class="flex h-9 items-center gap-1.5 px-3 text-[12px] font-medium text-sky-300 transition-colors hover:bg-sky-500/15 hover:text-sky-200"
        :title="`Update available: ${latest} — click to download & install`"
        @click="onUpdateClick"
      >
        <span class="size-1.5 animate-pulse rounded-full bg-sky-400" />
        Update
      </button>
      <button
        class="h-9 px-3 text-[13px] text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-zinc-100"
      >
        Login
      </button>
      <button
        v-for="ctrl in windowConfig"
        :key="ctrl.id"
        class="flex h-9 w-11 items-center justify-center text-zinc-400 transition-colors"
        :class="
          ctrl.id === 'close'
            ? 'hover:bg-red-600 hover:text-white'
            : 'hover:bg-white/[0.1] hover:text-zinc-100'
        "
        :aria-label="ctrl.label"
        @click="sendWindowCommand(ctrl.method)"
      >
        <component :is="ctrl.symbol" class="size-3.5" />
      </button>
    </div>
  </div>
</template>
