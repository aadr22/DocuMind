export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

class ToastManager {
  private toasts: Toast[] = []
  private listeners: ((toasts: Toast[]) => void)[] = []

  addToast(type: ToastType, message: string, duration: number = 5000) {
    const toast: Toast = {
      id: Date.now().toString(),
      type,
      message,
      duration
    }

    this.toasts.push(toast)
    this.notifyListeners()

    // Auto remove toast after duration
    setTimeout(() => {
      this.removeToast(toast.id)
    }, duration)

    return toast.id
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
    this.notifyListeners()
  }

  clearToasts() {
    this.toasts = []
    this.notifyListeners()
  }

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.toasts]))
  }

  // Convenience methods
  success(message: string, duration?: number) {
    return this.addToast('success', message, duration)
  }

  error(message: string, duration?: number) {
    return this.addToast('error', message, duration)
  }

  info(message: string, duration?: number) {
    return this.addToast('info', message, duration)
  }

  warning(message: string, duration?: number) {
    return this.addToast('warning', message, duration)
  }
}

export const toast = new ToastManager()
