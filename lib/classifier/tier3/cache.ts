import type { ClassificationResult } from '../types'

const CACHE_KEY = 'algolens_classifier_cache'
const MAX_ENTRIES = 100

interface CacheEntry {
  hash: string
  result: ClassificationResult
  timestamp: number
}

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(code)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function getCached(
  code: string
): Promise<ClassificationResult | null> {
  const hash = await hashCode(code)
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entries: CacheEntry[] = JSON.parse(raw)
    const found = entries.find((e) => e.hash === hash)
    return found?.result ?? null
  } catch {
    return null
  }
}

export async function setCached(
  code: string,
  result: ClassificationResult
): Promise<void> {
  const hash = await hashCode(code)
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    let entries: CacheEntry[] = raw ? JSON.parse(raw) : []
    entries = entries.filter((e) => e.hash !== hash)
    entries.unshift({ hash, result, timestamp: Date.now() })
    if (entries.length > MAX_ENTRIES) entries = entries.slice(0, MAX_ENTRIES)
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entries))
  } catch {
    // storage unavailable — ignore
  }
}
