// Unified AI client so every Phase 6 feature (narrator, Q&A, complexity) can
// run on EITHER Anthropic Claude or Google Gemini. Keys live in sessionStorage:
//   algolens_api_key     → Claude
//   algolens_gemini_key  → Gemini
// Gemini is preferred when its key is set (e.g. when the Claude account is out
// of credits). All callers go through chatAI(); none talk to a provider directly.

export type AIProvider = 'claude' | 'gemini'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

const CLAUDE_KEY = 'algolens_api_key'
const GEMINI_KEY = 'algolens_gemini_key'
const CLAUDE_MODEL = 'claude-sonnet-4-6'
const GEMINI_MODEL = 'gemini-2.5-flash'

export function getAIKeys(): { claude: string; gemini: string } {
  try {
    return {
      claude: sessionStorage.getItem(CLAUDE_KEY) ?? '',
      gemini: sessionStorage.getItem(GEMINI_KEY) ?? '',
    }
  } catch {
    return { claude: '', gemini: '' }
  }
}

export function getActiveAI(): { provider: AIProvider; apiKey: string } | null {
  const { claude, gemini } = getAIKeys()
  if (gemini) return { provider: 'gemini', apiKey: gemini }
  if (claude) return { provider: 'claude', apiKey: claude }
  return null
}

export function hasAIKey(): boolean {
  return getActiveAI() !== null
}

interface ChatOpts {
  system: string
  messages: AIMessage[]
  maxTokens: number
}

async function callClaude(apiKey: string, opts: ChatOpts): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`HTTP ${response.status}${body ? ` – ${body.slice(0, 220)}` : ''}`)
  }
  const data = await response.json()
  return data?.content?.[0]?.text ?? ''
}

async function callGemini(apiKey: string, opts: ChatOpts): Promise<string> {
  // Gemini uses role "model" for assistant turns and a separate systemInstruction.
  const contents = opts.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}` +
    `:generateContent?key=${encodeURIComponent(apiKey)}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents,
      generationConfig: { maxOutputTokens: opts.maxTokens },
    }),
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`HTTP ${response.status}${body ? ` – ${body.slice(0, 220)}` : ''}`)
  }
  const data = await response.json()
  const parts = data?.candidates?.[0]?.content?.parts
  if (Array.isArray(parts)) {
    return parts.map((p: { text?: string }) => p.text ?? '').join('')
  }
  return ''
}

// Send a chat completion through whichever provider has a key. Returns the
// assistant's text. Throws Error(reason) on failure (no key, HTTP error, etc.).
export async function chatAI(opts: ChatOpts): Promise<string> {
  const active = getActiveAI()
  if (!active) throw new Error('No API key set (add a Claude or Gemini key in Settings)')
  return active.provider === 'gemini'
    ? callGemini(active.apiKey, opts)
    : callClaude(active.apiKey, opts)
}
