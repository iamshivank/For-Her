'use client'

import React from 'react'
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'

interface CalendarViewProps {
  onClose?: () => void
}

export function CalendarView({ onClose }: CalendarViewProps) {
  const { predictions, periodLogs } = useAppStore()
  const [cursor, setCursor] = React.useState(new Date())
  const [dir, setDir] = React.useState<'left' | 'right'>('left')

  const monthStart = startOfMonth(cursor)
  const monthEnd = endOfMonth(cursor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days: Date[] = []
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d)

  const onPrev = () => { setDir('right'); setCursor(subMonths(cursor, 1)) }
  const onNext = () => { setDir('left'); setCursor(addMonths(cursor, 1)) }

  const dayBadges = (day: Date) => {
    const events = predictions.filter(p => isSameDay(p.date, day))
    return events.map(e => (
      <span key={e.id} className={`inline-block w-1.5 h-1.5 rounded-full ${
        e.type === 'periodStart' ? 'bg-red-500' : e.type === 'fertileStart' ? 'bg-purple-500' : e.type === 'ovulation' ? 'bg-blue-500' : 'bg-green-500'
      }`} />
    ))
  }

  const isPeriodDay = (day: Date) => {
    return periodLogs.some(log => {
      const start = log.startDate
      const end = log.endDate ?? log.startDate
      return day >= startOfMonth(start) && day <= endOfMonth(end) && day >= start && day <= end
    })
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-xl">{format(cursor, 'MMMM yyyy')}</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onPrev}>Previous</Button>
          <Button variant="outline" onClick={() => { setDir('left'); setCursor(new Date()) }}>Today</Button>
          <Button variant="outline" onClick={onNext}>Next</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 text-xs text-gray-500 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="px-2 py-1">{d}</div>
          ))}
        </div>
        <div className="relative overflow-hidden">
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={format(cursor, 'yyyy-MM')}
              custom={dir}
              initial={{ x: dir === 'left' ? 40 : -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: dir === 'left' ? -40 : 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 24 }}
              className="grid grid-cols-7 gap-1"
            >
              {days.map(day => (
                <div key={day.toISOString()} className={`aspect-square p-2 rounded-lg border text-sm flex flex-col ${
                  isSameMonth(day, monthStart) ? 'bg-white' : 'bg-gray-50'
                } ${isPeriodDay(day) ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                  <div className={`flex items-center justify-between ${isSameDay(day, new Date()) ? 'text-pink-600 font-semibold' : 'text-gray-700'}`}>
                    <span>{format(day, 'd')}</span>
                    <div className="flex gap-1">{dayBadges(day)}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
        {onClose && (
          <div className="mt-4 text-right">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


