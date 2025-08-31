'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from './AuthProvider'
import { Eye, EyeOff, Lock, Shield } from 'lucide-react'
import { useAppStore } from '@/lib/store'

interface LoginFormProps {
  isFirstTime?: boolean
  onCreatePassphrase?: (passphrase: string) => void
}

export function LoginForm({ isFirstTime = false, onCreatePassphrase }: LoginFormProps) {
  const [passphrase, setPassphrase] = useState('')
  const [confirmPassphrase, setConfirmPassphrase] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const { wipeAllData } = useAppStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (isFirstTime) {
        // Creating new passphrase
        if (passphrase !== confirmPassphrase) {
          setError('Passphrases do not match')
          return
        }

        if (passphrase.length < 12) {
          setError('Passphrase must be at least 12 characters long')
          return
        }

        onCreatePassphrase?.(passphrase)
      } else {
        // Logging in with existing passphrase
        const success = await login(passphrase)
        if (!success) {
          setError('Invalid passphrase. Please try again.')
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetApp = async () => {
    const confirmed = window.confirm('This will erase local data and reset the app. Continue?')
    if (!confirmed) return
    try {
      await wipeAllData()
    } catch { }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="w-full max-w-md backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-pink-100">
              {isFirstTime ? <Shield className="w-8 h-8 text-pink-600" /> : <Lock className="w-8 h-8 text-pink-600" />}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isFirstTime ? 'Create Your Passphrase' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isFirstTime
                ? 'Create a secure passphrase to protect your health data. This will be used to encrypt all your personal information.'
                : 'Enter your passphrase to access your encrypted health data.'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="passphrase">
                  {isFirstTime ? 'Create Passphrase' : 'Passphrase'}
                </Label>
                <div className="relative">
                  <Input
                    id="passphrase"
                    type={showPassphrase ? 'text' : 'password'}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter a strong passphrase"
                    required
                    minLength={isFirstTime ? 12 : 1}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
                  >
                    {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isFirstTime && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassphrase">Confirm Passphrase</Label>
                  <Input
                    id="confirmPassphrase"
                    type={showPassphrase ? 'text' : 'password'}
                    value={confirmPassphrase}
                    onChange={(e) => setConfirmPassphrase(e.target.value)}
                    placeholder="Confirm your passphrase"
                    required
                    minLength={12}
                  />
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              {isFirstTime && (
                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
                  <p className="font-medium mb-1">Passphrase Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>At least 12 characters long</li>
                    <li>Mix of letters, numbers, and symbols</li>
                    <li>Something memorable but unique</li>
                  </ul>
                  <p className="mt-2 font-medium text-amber-600">
                    ⚠️ Important: Write this down! If you forget it, your data cannot be recovered.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || (isFirstTime && passphrase.length < 12)}
              >
                {isSubmitting ? 'Processing...' : (isFirstTime ? 'Create Account' : 'Sign In')}
              </Button>
              {!isFirstTime && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResetApp}
                    className="mt-2 text-xs text-red-600 hover:underline"
                  >
                    Forgot passphrase? Reset app
                  </button>
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Your data is encrypted locally and never leaves your device without your explicit consent.
              </p>
            </div>

            {!isFirstTime && (
              <div className="mt-4 text-center">
                <Button variant="destructive" size="sm" onClick={handleResetApp}>
                  Reset App (Forgot passphrase)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
