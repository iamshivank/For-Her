'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import { Calendar, Heart, Shield, Target } from 'lucide-react'
import { format, subDays } from 'date-fns'

interface OnboardingFlowProps {
  passphrase: string
}

export function OnboardingFlow({ passphrase }: OnboardingFlowProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    goals: 'track' as 'track' | 'ttc' | 'pregnant' | 'postpartum' | 'perimenopause',
    cycleLengthAvg: 28,
    lastPeriodDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    notifications: {
      period: true,
      fertile: true,
      pill: false,
      hydration: false,
      exercise: false,
    }
  })

  const { updateHealthProfile, updateUserPrefs, authenticate, initializeApp } = useAppStore()

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    try {
      // First authenticate with the passphrase
      await authenticate(passphrase)
      
      // Update health profile
      await updateHealthProfile({
        goals: formData.goals,
        cycleLengthAvg: formData.cycleLengthAvg,
        lastPeriodDate: new Date(formData.lastPeriodDate),
      })

      // Update user preferences
      await updateUserPrefs({
        notificationPrefs: {
          ...formData.notifications,
          custom: true,
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '07:00',
          }
        },
      })

      // Initialize the app
      await initializeApp()
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    }
  }

  const steps = [
    {
      title: 'Welcome to CycleWise',
      icon: <Heart className="w-8 h-8 text-pink-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            CycleWise is your privacy-first period and reproductive health tracker. 
            All your data is encrypted and stored locally on your device.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg">
              <Shield className="w-5 h-5 text-pink-600" />
              <span className="text-sm">End-to-end encrypted</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span className="text-sm">Smart predictions</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Heart className="w-5 h-5 text-blue-600" />
              <span className="text-sm">Wellness features</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'What are your goals?',
      icon: <Target className="w-8 h-8 text-purple-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Tell us what you'd like to track so we can personalize your experience.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {[
              { value: 'track', label: 'General tracking', description: 'Track periods and symptoms' },
              { value: 'ttc', label: 'Trying to conceive', description: 'Optimize for fertility tracking' },
              { value: 'pregnant', label: 'Pregnancy', description: 'Pregnancy tracking and tips' },
              { value: 'postpartum', label: 'Postpartum', description: 'Recovery and cycle return' },
              { value: 'perimenopause', label: 'Perimenopause', description: 'Menopause transition support' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFormData({ ...formData, goals: option.value as any })}
                className={`p-4 text-left border rounded-lg transition-colors ${
                  formData.goals === option.value
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-gray-500">{option.description}</div>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Tell us about your cycle',
      icon: <Calendar className="w-8 h-8 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            This helps us provide better predictions. You can always update this later.
          </p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cycleLength">Average cycle length (days)</Label>
              <Input
                id="cycleLength"
                type="number"
                min="20"
                max="40"
                value={formData.cycleLengthAvg}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  cycleLengthAvg: parseInt(e.target.value) || 28 
                })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Most people have cycles between 21-35 days. The average is 28 days.
              </p>
            </div>
            
            <div>
              <Label htmlFor="lastPeriod">When did your last period start?</Label>
              <Input
                id="lastPeriod"
                type="date"
                value={formData.lastPeriodDate}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  lastPeriodDate: e.target.value 
                })}
              />
              <p className="text-xs text-gray-500 mt-1">
                This helps us predict your next period. It's okay if you're not sure - just estimate.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Notification preferences',
      icon: <Heart className="w-8 h-8 text-green-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Choose which reminders you'd like to receive. You can change these anytime in settings.
          </p>
          <div className="space-y-3">
            {[
              { key: 'period', label: 'Period reminders', description: 'Get notified before your period starts' },
              { key: 'fertile', label: 'Fertile window', description: 'Reminders about your fertile days' },
              { key: 'pill', label: 'Pill reminders', description: 'Daily medication reminders' },
              { key: 'hydration', label: 'Hydration', description: 'Drink water reminders' },
              { key: 'exercise', label: 'Exercise', description: 'Movement and wellness reminders' },
            ].map((option) => (
              <label
                key={option.key}
                className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={formData.notifications[option.key as keyof typeof formData.notifications]}
                  onChange={(e) => setFormData({
                    ...formData,
                    notifications: {
                      ...formData.notifications,
                      [option.key]: e.target.checked
                    }
                  })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )
    }
  ]

  const currentStep = steps[step - 1]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-pink-100">
            {currentStep.icon}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {currentStep.title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            Step {step} of {steps.length}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {currentStep.content}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              Previous
            </Button>
            
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index + 1 <= step ? 'bg-pink-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            
            <Button onClick={handleNext}>
              {step === steps.length ? 'Complete Setup' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
