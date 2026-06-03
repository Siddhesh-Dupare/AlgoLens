'use client'

// Bridge to the native CEF shell (Phase 5). In a plain browser these are
// no-ops, so the same build runs both in the browser and inside AlgoLens.

interface CefQueryRequest {
  request: string
  onSuccess: (response: string) => void
  onFailure: (errorCode: number, errorMessage: string) => void
  persistent?: boolean
}

declare global {
  interface Window {
    cefQuery?: (req: CefQueryRequest) => number
  }
}

export function isNative(): boolean {
  return typeof window !== 'undefined' && typeof window.cefQuery === 'function'
}

export function callNative(
  method: string,
  params?: Record<string, unknown>
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isNative()) {
      resolve('{"error":"not native"}')
      return
    }
    window.cefQuery!({
      request: JSON.stringify({ method, ...params }),
      onSuccess: resolve,
      onFailure: (_code: number, msg: string) => reject(msg),
    })
  })
}

export function getAppVersion(): Promise<string> {
  return callNative('getAppVersion')
}

export function setWindowTitle(title: string): Promise<string> {
  return callNative('setWindowTitle', { title })
}

export function openDevTools(): Promise<string> {
  return callNative('openDevTools')
}
