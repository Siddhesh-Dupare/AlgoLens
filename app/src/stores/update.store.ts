import { defineStore } from 'pinia'
import { ref } from 'vue'

// Bump this on every release so the notifier knows the running version.
const CURRENT_VERSION = '0.1.0'
const REPO_SLUG = 'Siddhesh-Dupare/AlgoLens'
const RELEASES_API = `https://api.github.com/repos/${REPO_SLUG}/releases`

function parseVersion(tag: string): number[] {
  const core = (tag ?? '').replace(/^v/i, '').split('-')[0] ?? ''
  return core.split('.').map((n) => parseInt(n, 10) || 0)
}

function isNewer(a: number[], b: number[]): boolean {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x !== y) return x > y
  }
  return false
}

export const useUpdateStore = defineStore('update', () => {
  const available = ref(false)
  const latest = ref('')
  const installerUrl = ref('')
  const releaseUrl = ref('')

  // Poll GitHub Releases (includes pre-releases/beta) and compare versions.
  async function check() {
    try {
      const res = await fetch(RELEASES_API, {
        headers: { Accept: 'application/vnd.github+json' },
      })
      if (!res.ok) return
      const list = await res.json()
      const rel = Array.isArray(list) ? list.find((r) => !r.draft) : null
      if (!rel) return

      if (isNewer(parseVersion(rel.tag_name), parseVersion(CURRENT_VERSION))) {
        available.value = true
        latest.value = rel.tag_name
        releaseUrl.value = rel.html_url
        const asset = (rel.assets ?? []).find((a: { name: string }) =>
          a.name.toLowerCase().endsWith('.exe'),
        )
        installerUrl.value = asset?.browser_download_url ?? ''
      }
    } catch {
      // offline or rate-limited — silently ignore
    }
  }

  return { available, latest, installerUrl, releaseUrl, check }
})
