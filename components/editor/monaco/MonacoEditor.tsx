'use client'

import dynamic from 'next/dynamic'
import { useRef, useCallback, useEffect, useState } from 'react'
import type { OnMount, BeforeMount } from '@monaco-editor/react'

const MonacoEditorLib = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', background: '#1e1e1e' }} />
  ),
})

const DEFAULT_CODE: Record<string, string> = {
  python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr


data = [64, 34, 25, 12, 22, 11, 90]
print(bubble_sort(data))
`,
  javascript: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}

const data = [64, 34, 25, 12, 22, 11, 90];
console.log(bubbleSort(data));
`,
  cpp: `#include <iostream>
#include <vector>
using namespace std;

void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (arr[j] > arr[j + 1])
                swap(arr[j], arr[j + 1]);
}

int main() {
    vector<int> data = {64, 34, 25, 12, 22, 11, 90};
    bubbleSort(data);
    for (int x : data) cout << x << " ";
    return 0;
}
`,
  c: `#include <stdio.h>

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
}

int main() {
    int data[] = {64, 34, 25, 12, 22, 11, 90};
    bubbleSort(data, 7);
    for (int i = 0; i < 7; i++) printf("%d ", data[i]);
    return 0;
}
`,
  java: `public class BubbleSort {
    static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n - i - 1; j++)
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
    }

    public static void main(String[] args) {
        int[] data = {64, 34, 25, 12, 22, 11, 90};
        bubbleSort(data);
        for (int x : data) System.out.print(x + " ");
    }
}
`,
}

export default function MonacoEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null)

  const [language, setLanguage] = useState<string>('python')
  const [fontSize, setFontSize] = useState<number>(14)
  const [minimapEnabled, setMinimapEnabled] = useState<boolean>(false)
  const [wordWrap, setWordWrap] = useState<'off' | 'on'>('off')

  const handleBeforeMount = useCallback<BeforeMount>((monaco) => {
    monacoRef.current = monaco
  }, [])

  const handleMount = useCallback<OnMount>((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      editor.layout()
    })
    observer.observe(container)

    editor.layout()

    return () => {
      observer.disconnect()
    }
  }, [])

  // Language switching via custom event. Loads that language's default code.
  // (When a file is selected, a follow-up 'algolens:set-content' event overrides
  // this with the file's actual content — dispatched synchronously after, so it wins.)
  useEffect(() => {
    const handler = (e: Event) => {
      const lang = (e as CustomEvent).detail.language as string
      setLanguage(lang)
      editorRef.current?.setValue(DEFAULT_CODE[lang] ?? '')
    }
    window.addEventListener('algolens:set-language', handler)
    return () => window.removeEventListener('algolens:set-language', handler)
  }, [])

  // Zoom via custom event.
  useEffect(() => {
    const handler = (e: Event) => {
      const dir = (e as CustomEvent).detail.direction as string
      setFontSize((prev) => {
        if (dir === 'in') return Math.min(prev + 1, 28)
        if (dir === 'out') return Math.max(prev - 1, 10)
        if (dir === 'reset') return 14
        return prev
      })
    }
    window.addEventListener('algolens:zoom', handler)
    return () => window.removeEventListener('algolens:zoom', handler)
  }, [])

  // Toggle minimap via custom event.
  useEffect(() => {
    const handler = () => setMinimapEnabled((prev) => !prev)
    window.addEventListener('algolens:toggle-minimap', handler)
    return () => window.removeEventListener('algolens:toggle-minimap', handler)
  }, [])

  // Toggle word wrap via custom event.
  useEffect(() => {
    const handler = () => setWordWrap((prev) => (prev === 'off' ? 'on' : 'off'))
    window.addEventListener('algolens:toggle-wordwrap', handler)
    return () => window.removeEventListener('algolens:toggle-wordwrap', handler)
  }, [])

  // Load file content imperatively when a file is selected in the explorer.
  useEffect(() => {
    const handler = (e: Event) => {
      const content = (e as CustomEvent).detail.content as string
      editorRef.current?.setValue(content)
    }
    window.addEventListener('algolens:set-content', handler)
    return () => window.removeEventListener('algolens:set-content', handler)
  }, [])

  // Keep the model's syntax language in sync. Content is driven imperatively
  // by the set-language / set-content handlers, so we do NOT setValue here
  // (that would overwrite file content loaded from the explorer).
  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, language)
    }
  }, [language])

  // Apply live option changes to the editor.
  useEffect(() => {
    editorRef.current?.updateOptions({
      fontSize,
      minimap: { enabled: minimapEnabled },
      wordWrap,
    })
  }, [fontSize, minimapEnabled, wordWrap])

  const monacoOptions = {
    fontSize,
    lineHeight: Math.round(fontSize * 1.6),
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontLigatures: true,
    minimap: { enabled: minimapEnabled },
    wordWrap,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'all' as const,
    cursorBlinking: 'smooth' as const,
    cursorSmoothCaretAnimation: 'on' as const,
    smoothScrolling: true,
    contextmenu: true,
    folding: true,
    lineNumbers: 'on' as const,
    glyphMargin: true,
    lineDecorationsWidth: 8,
    lineNumbersMinChars: 4,
    padding: { top: 16, bottom: 16 },
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    scrollbar: {
      vertical: 'auto' as const,
      horizontal: 'auto' as const,
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6,
      useShadows: false,
    },
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: false, indentation: true },
    renderWhitespace: 'none' as const,
    tabSize: 4,
    insertSpaces: true,
    automaticLayout: false,
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#1e1e1e',
        overflow: 'hidden',
      }}
    >
      <MonacoEditorLib
        height="100%"
        width="100%"
        language={language}
        theme="vs-dark"
        defaultValue={DEFAULT_CODE.python}
        options={monacoOptions}
        onMount={handleMount}
        beforeMount={handleBeforeMount}
      />
    </div>
  )
}
