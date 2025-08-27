'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Pause, Square, Settings } from 'lucide-react'
import { BREATHING_PROTOCOLS } from '@/lib/types'
import { useAppStore } from '@/lib/store'

type BreathingPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2'

interface BreathingExerciseProps {
  protocol?: keyof typeof BREATHING_PROTOCOLS
  onComplete?: (duration: number, cycles: number) => void
}

export function BreathingExercise({ 
  protocol = 'box', 
  onComplete 
}: BreathingExerciseProps) {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<BreathingPhase>('inhale')
  const [phaseProgress, setPhaseProgress] = useState(0)
  const [currentCycle, setCurrentCycle] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [selectedProtocol, setSelectedProtocol] = useState(protocol)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const { addBreathingSession } = useAppStore()

  const protocolConfig = BREATHING_PROTOCOLS[selectedProtocol]
  const phases: BreathingPhase[] = ['inhale', 'hold1', 'exhale', 'hold2']
  const phaseDurations = {
    inhale: protocolConfig.inhale,
    hold1: protocolConfig.hold1,
    exhale: protocolConfig.exhale,
    hold2: protocolConfig.hold2
  }

  const currentPhaseDuration = phaseDurations[currentPhase]

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setPhaseProgress(prev => {
          const newProgress = prev + 0.1
          
          if (newProgress >= currentPhaseDuration) {
            // Move to next phase
            const currentPhaseIndex = phases.indexOf(currentPhase)
            const nextPhaseIndex = (currentPhaseIndex + 1) % phases.length
            const nextPhase = phases[nextPhaseIndex]
            
            setCurrentPhase(nextPhase)
            
            // If we completed a full cycle (back to inhale)
            if (nextPhase === 'inhale') {
              setCurrentCycle(prev => prev + 1)
            }
            
            return 0
          }
          
          return newProgress
        })
        
        setTotalTime(prev => prev + 0.1)
      }, 100)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, isPaused, currentPhase, currentPhaseDuration, phases])

  const startExercise = () => {
    setIsActive(true)
    setIsPaused(false)
    startTimeRef.current = Date.now()
  }

  const pauseExercise = () => {
    setIsPaused(!isPaused)
  }

  const stopExercise = async () => {
    setIsActive(false)
    setIsPaused(false)
    
    if (totalTime > 30) { // Only save sessions longer than 30 seconds
      try {
        await addBreathingSession({
          date: new Date(),
          protocol: selectedProtocol,
          durationSec: Math.round(totalTime),
          cycles: currentCycle
        })
      } catch (error) {
        console.error('Failed to save breathing session:', error)
      }
    }
    
    onComplete?.(totalTime, currentCycle)
    
    // Reset state
    setCurrentPhase('inhale')
    setPhaseProgress(0)
    setCurrentCycle(0)
    setTotalTime(0)
  }

  const getPhaseInstruction = () => {
    switch (currentPhase) {
      case 'inhale': return 'Breathe In'
      case 'hold1': return 'Hold'
      case 'exhale': return 'Breathe Out'
      case 'hold2': return 'Hold'
    }
  }

  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'inhale': return 'text-blue-600'
      case 'hold1': return 'text-yellow-600'
      case 'exhale': return 'text-green-600'
      case 'hold2': return 'text-purple-600'
    }
  }

  const progressPercentage = (phaseProgress / currentPhaseDuration) * 100

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Protocol Selection */}
      {!isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Choose Exercise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(BREATHING_PROTOCOLS).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedProtocol(key as keyof typeof BREATHING_PROTOCOLS)}
                className={`w-full p-3 text-left border rounded-lg transition-colors ${
                  selectedProtocol === key
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{config.name}</div>
                <div className="text-sm text-gray-500">{config.description}</div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Breathing Circle */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative w-64 h-64 mx-auto">
            {/* Background Circle */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            
            {/* Progress Circle */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 120}`}
                strokeDashoffset={`${2 * Math.PI * 120 * (1 - progressPercentage / 100)}`}
                className={`transition-all duration-100 ${getPhaseColor()}`}
              />
            </svg>
            
            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className={`text-2xl font-bold mb-2 ${getPhaseColor()}`}>
                {getPhaseInstruction()}
              </div>
              <div className="text-lg text-gray-600">
                {Math.ceil(currentPhaseDuration - phaseProgress)}s
              </div>
              {isActive && (
                <div className="text-sm text-gray-500 mt-2">
                  Cycle {currentCycle + 1}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {isActive && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.floor(totalTime / 60)}:{(totalTime % 60).toFixed(0).padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-500">Total Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{currentCycle}</div>
                <div className="text-sm text-gray-500">Cycles</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {!isActive ? (
          <Button onClick={startExercise} size="lg" className="px-8">
            <Play className="w-5 h-5 mr-2" />
            Start
          </Button>
        ) : (
          <>
            <Button onClick={pauseExercise} variant="outline" size="lg">
              <Pause className="w-5 h-5 mr-2" />
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button onClick={stopExercise} variant="outline" size="lg">
              <Square className="w-5 h-5 mr-2" />
              Stop
            </Button>
          </>
        )}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{protocolConfig.name}</CardTitle>
          <CardDescription>{protocolConfig.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Inhale:</span>
              <span>{protocolConfig.inhale}s</span>
            </div>
            {protocolConfig.hold1 > 0 && (
              <div className="flex justify-between">
                <span>Hold:</span>
                <span>{protocolConfig.hold1}s</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Exhale:</span>
              <span>{protocolConfig.exhale}s</span>
            </div>
            {protocolConfig.hold2 > 0 && (
              <div className="flex justify-between">
                <span>Hold:</span>
                <span>{protocolConfig.hold2}s</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
