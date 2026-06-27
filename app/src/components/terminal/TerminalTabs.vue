<script setup lang="ts">
import { ref } from 'vue'
import { Plus, X, ChevronDown, SquareTerminal } from '@lucide/vue'
import { useTerminalStore } from '@/stores/terminal.store'
import { storeToRefs } from 'pinia'

const store = useTerminalStore()
const { sessions, activeSessionId, availableShells } = storeToRefs(store)

const menuOpen = ref(false)

function pickShell(id: string, label: string) {
  store.createSession(id, label)
  menuOpen.value = false
}
</script>

<template>
  <div
    class="flex h-8 select-none items-center border-b border-white/[0.08] bg-[#1b1d22] text-[12px]"
  >
    <div class="flex flex-1 items-center overflow-x-auto">
      <div
        v-for="session in sessions"
        :key="session.id"
        class="group flex items-center gap-1.5 border-r border-white/[0.06] px-3 py-1 cursor-pointer transition-colors"
        :class="
          session.id === activeSessionId
            ? 'bg-white/[0.08] text-zinc-100'
            : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
        "
        @click="store.setActiveSession(session.id)"
      >
        <SquareTerminal class="size-3.5 shrink-0 opacity-70" />
        <span class="truncate">{{ session.name }}</span>
        <X
          class="size-3.5 shrink-0 rounded text-zinc-500 opacity-0 transition-opacity hover:bg-white/10 hover:text-zinc-200 group-hover:opacity-100"
          @click.stop="store.closeSession(session.id)"
        />
      </div>
    </div>

    <!-- New terminal + shell picker -->
    <div class="relative flex items-center pr-1">
      <button
        class="flex h-8 items-center px-2 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100"
        title="New Terminal"
        @click="store.createSession()"
      >
        <Plus class="size-4" />
      </button>
      <button
        class="flex h-8 items-center px-1 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100"
        title="Select Shell"
        @click="menuOpen = !menuOpen"
      >
        <ChevronDown class="size-3.5" />
      </button>

      <template v-if="menuOpen">
        <div class="fixed inset-0 z-40" @click="menuOpen = false" />
        <div
          class="absolute right-1 top-full z-50 mt-1 min-w-[11rem] rounded-lg border border-white/10 bg-[#1f2127] p-1 text-zinc-300 shadow-xl shadow-black/40"
        >
          <div class="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            New Terminal
          </div>
          <button
            v-for="shell in availableShells"
            :key="shell.id"
            class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-zinc-300 hover:bg-white/[0.08] hover:text-zinc-50"
            @click="pickShell(shell.id, shell.label)"
          >
            <SquareTerminal class="size-3.5 shrink-0 opacity-70" />
            {{ shell.label }}
          </button>
          <div v-if="!availableShells.length" class="px-2 py-1.5 text-[12px] text-zinc-500">
            No shells detected
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
