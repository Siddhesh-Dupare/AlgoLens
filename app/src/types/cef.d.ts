interface CefQueryRequest {
  request: string
  onSuccess: (response: string) => void
  onFailure: (errorCode: number, errorMessage: string) => void
}

interface Window {
  cefQuery: (request: CefQueryRequest) => void
  cefQueryCancel?: (requestId: number) => void
  // Called by the C++ shell to surface desktop-side errors as a toast.
  __algolensError?: (title: string, message: string) => void
}
