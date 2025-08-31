'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAISuggestions } from '@/lib/ai'
import { useAppStore } from '@/lib/store'

export function AIInsight() {
  const { periodLogs, symptomLogs, moodLogs, healthProfile } = useAppStore()
  const [loading, setLoading] = React.useState(false)
  const [text, setText] = React.useState<string | null>(null)

  const run = async () => {
    setLoading(true)
    try {
      const context = {
        periodLogs: periodLogs.slice(-6).map(l => ({ startDate: l.startDate, endDate: l.endDate, flow: l.flow })),
        symptomLogs: symptomLogs.slice(-20).map(s => ({ date: s.date, tags: s.tags, intensity: s.intensity })),
        moodLogs: moodLogs.slice(-20).map(m => ({ date: m.date, mood: m.mood })),
        profile: healthProfile
      }
      const t = await getAISuggestions('Give one personalized, supportive daily tip.', context)
      setText(t)
    } catch (e) {
      setText('AI not available or failed. Configure OPENAI_API_KEY to enable insights.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Daily Insight</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {text && (
            <div className="p-3 bg-pink-50 border border-pink-200 rounded-md text-sm text-pink-900 whitespace-pre-wrap">{text}</div>
          )}
          <Button onClick={run} disabled={loading}>{loading ? 'Thinking…' : 'Generate Insight'}</Button>
        </div>
      </CardContent>
    </Card>
  )
}


