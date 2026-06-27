// GitHub links for Help-menu items. Update GITHUB_REPO to your real repo.
export const GITHUB_REPO = 'https://github.com/Siddhesh-Dupare/AlgoLens'
export const REPORT_BUG_URL = `${GITHUB_REPO}/issues/new?labels=bug&title=%5BBug%5D%3A%20`
// Feature requests go to GitHub Discussions (Ideas category).
export const FEATURE_REQUEST_URL = `${GITHUB_REPO}/discussions/new?category=ideas`
export const DOCS_URL = `${GITHUB_REPO}#readme`

// Open a URL in the system browser via the C++ shell; falls back to window.open
// (e.g. when running in a plain browser during development).
export function openExternal(url: string) {
  if (window.cefQuery) {
    window.cefQuery({
      request: JSON.stringify({ type: 'openExternal', url }),
      onSuccess: () => {},
      onFailure: () => window.open(url, '_blank'),
    })
  } else {
    window.open(url, '_blank')
  }
}

// Ask the C++ shell to download the installer and run it (it updates in place,
// then the app closes). Falls back to opening the release page in the browser.
export function installUpdate(installerUrl: string, releaseUrl: string) {
  if (window.cefQuery && installerUrl) {
    window.cefQuery({
      request: JSON.stringify({ type: 'installUpdate', url: installerUrl }),
      onSuccess: () => {},
      onFailure: () => openExternal(releaseUrl || installerUrl),
    })
  } else {
    openExternal(releaseUrl || installerUrl)
  }
}
