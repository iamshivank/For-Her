/**
 * PWA utilities for service worker registration and push notifications
 */

export interface PWAInstallPrompt {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: Event & {
      prompt(): Promise<void>
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
    }
  }
  interface NotificationAction {
    action: string
    title: string
    icon?: string
  }
  interface NotificationOptions {
    actions?: NotificationAction[]
  }
}

let deferredPrompt: PWAInstallPrompt | null = null

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    })

    console.log('Service worker registered:', registration)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker is available
          showUpdateNotification()
        }
      })
    })

    return registration
  } catch (error) {
    console.error('Service worker registration failed:', error)
    return null
  }
}

/**
 * Check if app can be installed
 */
export function canInstallPWA(): boolean {
  return deferredPrompt !== null
}

/**
 * Prompt user to install PWA
 */
export async function installPWA(): Promise<boolean> {
  if (!deferredPrompt) {
    return false
  }

  try {
    await deferredPrompt.prompt()
    const choiceResult = await deferredPrompt.userChoice

    deferredPrompt = null

    return choiceResult.outcome === 'accepted'
  } catch (error) {
    console.error('PWA installation failed:', error)
    return false
  }
}

/**
 * Setup PWA install prompt listener
 */
export function setupInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as PWAInstallPrompt

    // Dispatch custom event that components can listen to
    window.dispatchEvent(new CustomEvent('pwa-install-available'))
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    console.log('PWA was installed')

    // Track installation
    if (typeof (window as any).gtag !== 'undefined') {
      (window as any).gtag('event', 'pwa_install', {
        event_category: 'engagement',
        event_label: 'PWA installed'
      })
    }
  })
}

/**
 * Request push notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission
  }

  return Notification.permission
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  if (!registration.pushManager) {
    console.warn('Push notifications not supported')
    return null
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_KEY || ''
      )
    })

    console.log('Push subscription successful:', subscription)
    return subscription
  } catch (error) {
    console.error('Push subscription failed:', error)
    return null
  }
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray.buffer
}

/**
 * Show update notification
 */
function showUpdateNotification(): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('CycleWise Updated', {
      body: 'A new version of CycleWise is available. Refresh to update.',
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      tag: 'app-update',
      requireInteraction: true,
      actions: [
        {
          action: 'refresh',
          title: 'Refresh Now'
        },
        {
          action: 'dismiss',
          title: 'Later'
        }
      ]
    })

    notification.onclick = () => {
      window.location.reload()
    }
  } else {
    // Show in-app update banner
    window.dispatchEvent(new CustomEvent('pwa-update-available'))
  }
}

/**
 * Check if running as PWA
 */
export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as any).standalone === true
}

/**
 * Get PWA display mode
 */
export function getPWADisplayMode(): string {
  const displayModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser']

  for (const mode of displayModes) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) {
      return mode
    }
  }

  return 'browser'
}

/**
 * Handle PWA navigation
 */
export function setupPWANavigation(): void {
  // Prevent default browser back button behavior in PWA
  if (isPWA()) {
    window.addEventListener('popstate', (event) => {
      // Handle custom navigation logic here
      console.log('PWA navigation:', event)
    })
  }
}

/**
 * Share content using Web Share API
 */
export async function shareContent(data: {
  title?: string
  text?: string
  url?: string
}): Promise<boolean> {
  if (!('share' in navigator)) {
    // Fallback to clipboard
    if (data.url) {
      try {
        const clip = (navigator as any).clipboard
        if (clip && typeof clip.writeText === 'function') {
          await clip.writeText(data.url)
          return true
        }
        return false
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
        return false
      }
    }
    return false
  }

  try {
    await navigator.share(data)
    return true
  } catch (error) {
    console.error('Web share failed:', error)
    return false
  }
}

/**
 * Initialize PWA features
 */
export function initializePWA(): void {
  if (typeof window === 'undefined') return

  setupInstallPrompt()
  setupPWANavigation()
  registerServiceWorker()

  // Add PWA class to body for styling
  if (isPWA()) {
    document.body.classList.add('pwa-mode')
  }

  // Handle online/offline status
  window.addEventListener('online', () => {
    document.body.classList.remove('offline')
    window.dispatchEvent(new CustomEvent('pwa-online'))
  })

  window.addEventListener('offline', () => {
    document.body.classList.add('offline')
    window.dispatchEvent(new CustomEvent('pwa-offline'))
  })
}
