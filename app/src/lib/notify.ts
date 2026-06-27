import { toast } from 'vue-sonner'

// Central error/notification surface. Renders via the <Toaster> in App.vue
// (bottom-right). Pass a stable `id` to collapse repeated identical errors
// (e.g. a server that stays down) into a single toast instead of stacking.
export function notifyError(title: string, description?: string, id?: string) {
  toast.error(title, { description, id })
}

export function notifyInfo(title: string, description?: string) {
  toast(title, { description })
}

export function notifySuccess(title: string, description?: string) {
  toast.success(title, { description })
}
