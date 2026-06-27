<script setup lang="ts">
import Menu from '@/components/menubar/MenuBar.vue'
import BottomBar from '@/components/bottombar/BottomBar.vue'
import FileExplorer from '@/components/explorer/FileExplorer.vue'
import TerminalPanel from '@/components/terminal/TerminalPanel.vue'
import Visualizer from '@/components/visualizer/Visualizer.vue'
import Tabs from '@/components/tabs/Tabs.vue'
import MonacoEditor from '@/components/editor/MonacoEditor.vue'

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Toaster } from '@/components/ui/sonner'

import { useTabsStore } from '@/stores/tabs.store'
import { useLayoutStore } from '@/stores/layout.store'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { useServerStore } from '@/stores/server.store'
import { useFileShortcuts } from '@/composables/useFileShortcuts'

useFileShortcuts()

const layout = useLayoutStore()
const tabsStore = useTabsStore()
const { explorerVisible, terminalVisible, visualizerVisible } = storeToRefs(layout)
const { activeTab } = storeToRefs(tabsStore)

const server = useServerStore()

onMounted(() => server.connect())
</script>

<template>
  <div class="flex flex-col h-screen">
    <!-- Header Menu -->
    <Menu />
    <ResizablePanelGroup direction="horizontal" class="flex-1 overflow-hidden">
      <!-- File Explorer -->
      <template v-if="explorerVisible">
        <ResizablePanel :default-size="16" :min-size="12" :max-size="40">
          <FileExplorer />
        </ResizablePanel>
        <ResizableHandle with-handle />
      </template>
      <!-- Main Window -->
      <ResizablePanel :default-size="65">
        <ResizablePanelGroup direction="vertical" class="flex-1 overflow-hidden">
          <ResizablePanel :default-size="80">
            <div class="flex flex-col h-full overflow-hidden">
              <!-- Editor Tabs -->
              <Tabs />
              <!-- Main Editor -->
              <main class="flex-1 overflow-hidden">
                <MonacoEditor
                  v-if="activeTab"
                  :key="activeTab.id"
                  v-model="activeTab.content"
                  :language="activeTab.language"
                />
                <div
                  v-else
                  class="flex h-full items-center justify-center bg-[#1b1d22] text-sm text-zinc-500"
                >
                  No file open
                </div>
              </main>
            </div>
          </ResizablePanel>
          <!-- Terminal Panel -->
          <ResizableHandle with-handle />
          <ResizablePanel v-show="terminalVisible" :default-size="25" :min-size="10">
            <TerminalPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <!-- Visualizer Panel -->
      <template v-if="visualizerVisible">
        <ResizableHandle with-handle />
        <ResizablePanel :default-size="20" :min-size="10">
          <Visualizer />
        </ResizablePanel>
      </template>
    </ResizablePanelGroup>
    <!-- Bottom Bar -->
    <BottomBar />

    <!-- Error / notification toasts (bottom-right) -->
    <Toaster position="bottom-right" theme="dark" :rich-colors="true" :close-button="true" />
  </div>
</template>

<style scoped></style>
