'use client'

import React, { createContext, useContext } from 'react'
import { useAppStore } from '@/lib/store'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (passphrase: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    isAuthenticated,
    isLoading,
    authenticate,
    logout,
    initializeApp
  } = useAppStore()

  const login = async (passphrase: string): Promise<boolean> => {
    const success = await authenticate(passphrase)
    if (success) {
      await initializeApp()
    }
    return success
  }

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
