'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import { FLOW_DESCRIPTIONS } from '@/lib/types'
import { Calendar, Droplets } from 'lucide-react'
import { format } from 'date-fns'

interface PeriodLogFormProps {
  onComplete?: () => void
  onCancel?: () => void
}

export function PeriodLogForm({ onComplete, onCancel }: PeriodLogFormProps) {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState('')
  const [flow, setFlow] = useState<number>(3)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { addPeriodLog } = useAppStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await addPeriodLog({
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        flow,
        notes: notes || undefined
      })
      
      onComplete?.()
    } catch (error) {
      console.error('Failed to add period log:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-red-500" />
          Log Period
        </CardTitle>
        <CardDescription>
          Record your period details to improve predictions
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Start Date */}
          <motion.div className="space-y-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </motion.div>

          {/* End Date */}
          <motion.div className="space-y-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Label htmlFor="endDate">End Date (optional)</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
            />
            <p className="text-xs text-gray-500">
              Leave empty if your period is ongoing
            </p>
          </motion.div>

          {/* Flow Intensity */}
          <motion.div className="space-y-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Label>Flow Intensity</Label>
            <div className="space-y-2">
              {Object.entries(FLOW_DESCRIPTIONS).map(([value, description]) => (
                <label
                  key={value}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    flow === parseInt(value)
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="flow"
                    value={value}
                    checked={flow === parseInt(value)}
                    onChange={(e) => setFlow(parseInt(e.target.value))}
                    className="text-red-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{description}</div>
                    <div className="text-sm text-gray-500">
                      {value === '1' && 'Light spotting, may not need protection'}
                      {value === '2' && 'Light flow, minimal protection needed'}
                      {value === '3' && 'Normal flow, regular protection'}
                      {value === '4' && 'Heavy flow, frequent changes needed'}
                      {value === '5' && 'Very heavy, may interfere with activities'}
                    </div>
                  </div>
                  <div className="flex">
                    {Array.from({ length: parseInt(value) }, (_, i) => (
                      <Droplets key={i} className="w-4 h-4 text-red-400" fill="currentColor" />
                    ))}
                  </div>
                </label>
              ))}
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div className="space-y-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details about your period..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none h-20 text-sm"
            />
          </motion.div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save Period'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
