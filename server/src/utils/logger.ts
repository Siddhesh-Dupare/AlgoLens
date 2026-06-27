function ts(): string {
  return new Date().toISOString().slice(11, 23)
}

export const logger = {
  info(...args: unknown[]): void {
    console.log(`[${ts()}]`, ...args)
  },
  warn(...args: unknown[]): void {
    console.warn(`[${ts()}] WARN`, ...args)
  },
  error(...args: unknown[]): void {
    console.error(`[${ts()}] ERROR`, ...args)
  },
}
