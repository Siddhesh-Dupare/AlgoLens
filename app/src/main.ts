import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import 'vue-sonner/style.css'
import { notifyError } from '@/lib/notify'

const app = createApp(App)

app.use(createPinia())

// algolens (vue) error catching -> bottom-right toast.
app.config.errorHandler = (err) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error('[vue]', err)
  notifyError('Application error', message)
}

window.addEventListener('unhandledrejection', (e) => {
  const reason = (e as PromiseRejectionEvent).reason
  const message = reason instanceof Error ? reason.message : String(reason)
  notifyError('Unhandled error', message, 'unhandledrejection')
})

// Hook the C++ desktop shell calls via ExecuteJavaScript to report its errors.
window.__algolensError = (title: string, message: string) => {
  notifyError(title || 'Desktop error', message)
}

app.mount('#app')
