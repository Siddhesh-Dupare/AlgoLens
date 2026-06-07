// Maps raw/technical error strings to user-friendly messages. Falls back to the
// raw string when no mapping applies, so nothing is ever hidden.

interface Rule {
  match: (raw: string) => boolean
  friendly: string
}

const RULES: Rule[] = [
  {
    match: (r) => /execution server not connected/i.test(r),
    friendly:
      'AlgoLens is starting up. Please wait a moment and try again. (Server connecting…)',
  },
  {
    match: (r) => /exited with code 1\b/i.test(r) || /exited with code [1-9]/i.test(r),
    friendly:
      'Your code exited with an error. Check the terminal output above for details.',
  },
  {
    match: (r) => /compil(e|ation) failed/i.test(r) || /\[compile\]/i.test(r),
    friendly:
      'Compilation failed. See the error messages above to fix your code.',
  },
  {
    match: (r) => /classification failed/i.test(r),
    friendly:
      'Could not identify the algorithm automatically. The visualization will show a generic view.',
  },
]

export function friendlyError(raw: string): string {
  for (const rule of RULES) {
    if (rule.match(raw)) return rule.friendly
  }
  return raw
}
