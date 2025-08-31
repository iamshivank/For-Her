'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import { SYMPTOM_CATEGORIES } from '@/lib/types'
import { Activity, Plus, X } from 'lucide-react'
import { format } from 'date-fns'

interface SymptomLogFormProps {
  onComplete?: () => void
  onCancel?: () => void
}

export function SymptomLogForm({ onComplete, onCancel }: SymptomLogFormProps) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [intensity, setIntensity] = useState<number>(3)
  const [notes, setNotes] = useState('')
  const [customSymptom, setCustomSymptom] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { addSymptomLog } = useAppStore()

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    )
  }

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms(prev => [...prev, customSymptom.trim()])
      setCustomSymptom('')
    }
  }

  const removeSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => prev.filter(s => s !== symptom))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedSymptoms.length === 0) {
      return
    }

    setIsSubmitting(true)

    try {
      await addSymptomLog({
        date: new Date(date),
        tags: selectedSymptoms,
        intensity,
        notes: notes || undefined
      })
      
      onComplete?.()
    } catch (error) {
      console.error('Failed to add symptom log:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          Log Symptoms
        </CardTitle>
        <CardDescription>
          Track how you&apos;re feeling to identify patterns in your cycle
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <motion.div className="space-y-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </motion.div>

          {/* Selected Symptoms */}
          {selectedSymptoms.length > 0 && (
            <motion.div className="space-y-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Label>Selected Symptoms ({selectedSymptoms.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map((symptom) => (
                  <span
                    key={symptom}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    {symptom.replace('-', ' ')}
                    <button
                      type="button"
                      onClick={() => removeSymptom(symptom)}
                      className="hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Symptom Categories */}
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Label>Choose Symptoms</Label>
            
            {Object.entries(SYMPTOM_CATEGORIES).map(([category, symptoms]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700 capitalize">
                  {category.replace('-', ' ')}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {symptoms.map((symptom) => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggleSymptom(symptom)}
                      className={`p-2 text-left border rounded-lg text-sm transition-colors ${
                        selectedSymptoms.includes(symptom)
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {symptom.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Add Custom Symptom */}
          <motion.div className="space-y-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Label htmlFor="customSymptom">Add Custom Symptom</Label>
            <div className="flex gap-2">
              <Input
                id="customSymptom"
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                placeholder="Enter a custom symptom..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSymptom())}
              />
              <Button
                type="button"
                onClick={addCustomSymptom}
                disabled={!customSymptom.trim()}
                size="icon"
                variant="outline"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          {/* Intensity */}
          {selectedSymptoms.length > 0 && (
            <motion.div className="space-y-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Label>Overall Intensity</Label>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label
                    key={value}
                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      intensity === value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="intensity"
                      value={value}
                      checked={intensity === value}
                      onChange={(e) => setIntensity(parseInt(e.target.value))}
                      className="text-purple-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {value === 1 && 'Very Mild'}
                        {value === 2 && 'Mild'}
                        {value === 3 && 'Moderate'}
                        {value === 4 && 'Severe'}
                        {value === 5 && 'Very Severe'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {value === 1 && 'Barely noticeable'}
                        {value === 2 && 'Noticeable but not bothersome'}
                        {value === 3 && 'Somewhat bothersome'}
                        {value === 4 && 'Very bothersome, affects daily activities'}
                        {value === 5 && 'Extremely bothersome, unable to function normally'}
                      </div>
                    </div>
                    <div className="flex">
                      {Array.from({ length: value }, (_, i) => (
                        <div key={i} className="w-2 h-2 bg-purple-400 rounded-full mx-0.5" />
                      ))}
                    </div>
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details about your symptoms..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none h-20 text-sm"
            />
          </div>

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
              disabled={isSubmitting || selectedSymptoms.length === 0}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save Symptoms'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
