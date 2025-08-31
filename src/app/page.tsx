'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LoginForm } from '@/components/auth/LoginForm'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { useAuth } from '@/components/auth/AuthProvider'
import { useAppStore } from '@/lib/store'

export default function Home() {
  const [newUserPassphrase, setNewUserPassphrase] = useState<string | null>(null)
  const { isAuthenticated, isLoading } = useAuth()
  const { onboardingComplete } = useAppStore()

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </motion.div>
      </div>
    )
  }

  // Show onboarding for new users
  if (newUserPassphrase && !onboardingComplete) {
    return <OnboardingFlow passphrase={newUserPassphrase} />
  }

  // Show dashboard for authenticated users
  if (isAuthenticated && onboardingComplete) {
    return <Dashboard />
  }

  // Show login/signup form
  return (
    <LoginForm 
      isFirstTime={!isAuthenticated && !onboardingComplete}
      onCreatePassphrase={setNewUserPassphrase}
    />
  )
}
