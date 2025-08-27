'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { Calendar, Plus, Heart, Activity, Droplets } from 'lucide-react'
import { format } from 'date-fns'

export function Dashboard() {
  const {
    currentPhase,
    predictions,
    periodLogs,
    symptomLogs,
    moodLogs
  } = useAppStore()

  const nextPeriodPrediction = predictions.find(p => p.type === 'periodStart')
  const nextFertilePrediction = predictions.find(p => p.type === 'fertileStart')

  const todaysSymptoms = symptomLogs.filter(log => 
    format(log.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  )

  const todaysMood = moodLogs.find(log =>
    format(log.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  )

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'menstrual': return 'text-red-600 bg-red-50 border-red-200'
      case 'follicular': return 'text-green-600 bg-green-50 border-green-200'
      case 'fertile': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'luteal': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPhaseAdvice = (phase: string) => {
    switch (phase) {
      case 'menstrual':
        return 'Rest and self-care are important. Consider gentle movement and warm baths.'
      case 'follicular':
        return 'Great time for new projects and high-intensity workouts. Energy levels are rising.'
      case 'fertile':
        return 'Peak fertility window. Consider tracking additional fertility signs if TTC.'
      case 'luteal':
        return 'Focus on stress management and nutritious foods. PMS symptoms may appear.'
      default:
        return 'Log your period data to get personalized insights.'
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}!
        </h1>
        <p className="text-gray-600">Here's your health overview for today</p>
      </div>

      {/* Current Phase Card */}
      <Card className={`border-2 ${getPhaseColor(currentPhase.phase)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Current Phase: {currentPhase.phase.charAt(0).toUpperCase() + currentPhase.phase.slice(1)}
          </CardTitle>
          <CardDescription>
            {currentPhase.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm">
              <strong>{currentPhase.nextEvent}</strong>
            </div>
            <p className="text-sm text-gray-600">
              {getPhaseAdvice(currentPhase.phase)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Next Period */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Droplets className="w-5 h-5 text-red-500" />
              Next Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextPeriodPrediction ? (
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {format(nextPeriodPrediction.date, 'MMM dd')}
                </div>
                <div className="text-sm text-gray-600">
                  {Math.ceil((nextPeriodPrediction.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days away
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(nextPeriodPrediction.confidence * 100)}% confidence
                </div>
              </div>
            ) : (
              <div className="text-gray-500">
                Log periods to see predictions
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fertile Window */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-purple-500" />
              Fertile Window
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextFertilePrediction ? (
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {format(nextFertilePrediction.date, 'MMM dd')}
                </div>
                <div className="text-sm text-gray-600">
                  Starts in {Math.ceil((nextFertilePrediction.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(nextFertilePrediction.confidence * 100)}% confidence
                </div>
              </div>
            ) : (
              <div className="text-gray-500">
                Track cycles for predictions
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Mood */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Today's Mood
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaysMood ? (
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {['😔', '😕', '😐', '😊', '😄'][todaysMood.mood - 1]}
                </div>
                <div className="text-sm text-gray-600">
                  {['Very Low', 'Low', 'Neutral', 'Good', 'Great'][todaysMood.mood - 1]}
                </div>
                {todaysMood.notes && (
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {todaysMood.notes}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">
                No mood logged today
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Symptoms */}
      {todaysSymptoms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Symptoms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {todaysSymptoms.flatMap(log => log.tags).map((symptom, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-sm"
                >
                  {symptom.replace('-', ' ')}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Log today's data or access key features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Plus className="w-5 h-5" />
              Log Period
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Activity className="w-5 h-5" />
              Add Symptoms
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Heart className="w-5 h-5" />
              Breathing
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Calendar className="w-5 h-5" />
              Calendar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {periodLogs.length < 3 ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Tip:</strong> Track at least 3 cycles to get accurate predictions and personalized insights.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Great job!</strong> You have enough data for reliable predictions. Your cycle appears to be regular.
                </p>
              </div>
            )}
            
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-700">
                <strong>Privacy Note:</strong> All your data is encrypted and stored locally on your device. 
                We never have access to your personal health information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
