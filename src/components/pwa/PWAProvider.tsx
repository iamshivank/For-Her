'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { initializePWA, canInstallPWA, installPWA, isPWA } from '@/lib/pwa'

interface PWAContextType {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  installApp: () => Promise<boolean>
  showInstallPrompt: boolean
  dismissInstallPrompt: () => void
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

export function usePWA() {
  const context = useContext(PWAContext)
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider')
  }
  return context
}

interface PWAProviderProps {
  children: React.ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    // Initialize PWA features
    initializePWA()

    // Set initial states
    setIsInstalled(isPWA())
    setIsOnline(navigator.onLine)

    // Listen for PWA events
    const handleInstallAvailable = () => {
      setIsInstallable(true)
      
      // Show install prompt after a delay if not already installed
      if (!isPWA()) {
        setTimeout(() => {
          setShowInstallPrompt(true)
        }, 30000) // Show after 30 seconds
      }
    }

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('pwa-install-available', handleInstallAvailable)
    window.addEventListener('pwa-online', handleOnline)
    window.addEventListener('pwa-offline', handleOffline)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable)
      window.removeEventListener('pwa-online', handleOnline)
      window.removeEventListener('pwa-offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const installApp = async (): Promise<boolean> => {
    const success = await installPWA()
    if (success) {
      setIsInstalled(true)
      setShowInstallPrompt(false)
    }
    return success
  }

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false)
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Check if install prompt was already dismissed
  useEffect(() => {
    const dismissed = sessionStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      setShowInstallPrompt(false)
    }
  }, [])

  const value: PWAContextType = {
    isInstallable,
    isInstalled,
    isOnline,
    installApp,
    showInstallPrompt,
    dismissInstallPrompt
  }

  return (
    <PWAContext.Provider value={value}>
      {children}
      
      {/* Install Prompt Banner */}
      {showInstallPrompt && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-pink-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-semibold">Install CycleWise</p>
              <p className="text-sm opacity-90">
                Install our app for the best experience and offline access.
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={installApp}
                className="bg-white text-pink-600 px-4 py-2 rounded font-semibold text-sm hover:bg-pink-50"
              >
                Install
              </button>
              <button
                onClick={dismissInstallPrompt}
                className="text-white/80 hover:text-white px-2"
                aria-label="Dismiss install prompt"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white p-2 text-center text-sm">
          <span className="font-medium">You're offline</span> - Some features may be limited
        </div>
      )}
    </PWAContext.Provider>
  )
}
