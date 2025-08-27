import { PeriodLog, Prediction, HealthProfile } from './types'
import { addDays, differenceInDays, startOfDay } from 'date-fns'

/**
 * Pure functions for cycle predictions with explainability
 * All calculations are deterministic and based on historical data
 */

interface CycleStats {
  averageLength: number
  standardDeviation: number
  confidence: number
  dataPoints: number
  regularityScore: number
}

/**
 * Calculates cycle statistics from period logs
 */
export function calculateCycleStats(periodLogs: PeriodLog[]): CycleStats {
  if (periodLogs.length < 2) {
    return {
      averageLength: 28,
      standardDeviation: 2,
      confidence: 0,
      dataPoints: 0,
      regularityScore: 0
    }
  }

  // Sort periods by start date
  const sortedPeriods = [...periodLogs]
    .filter(p => p.startDate)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

  // Calculate cycle lengths
  const cycleLengths: number[] = []
  for (let i = 1; i < sortedPeriods.length; i++) {
    const length = differenceInDays(
      sortedPeriods[i].startDate,
      sortedPeriods[i - 1].startDate
    )
    if (length > 15 && length < 45) { // Filter out outliers
      cycleLengths.push(length)
    }
  }

  if (cycleLengths.length === 0) {
    return {
      averageLength: 28,
      standardDeviation: 2,
      confidence: 0,
      dataPoints: 0,
      regularityScore: 0
    }
  }

  // Calculate trimmed mean (remove top/bottom 10% to reduce outlier impact)
  const sorted = [...cycleLengths].sort((a, b) => a - b)
  const trimCount = Math.floor(sorted.length * 0.1)
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount)
  
  const averageLength = trimmed.length > 0 
    ? trimmed.reduce((sum, length) => sum + length, 0) / trimmed.length
    : cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length

  // Calculate standard deviation
  const variance = cycleLengths.reduce((sum, length) => {
    return sum + Math.pow(length - averageLength, 2)
  }, 0) / cycleLengths.length
  
  const standardDeviation = Math.sqrt(variance)

  // Calculate confidence based on data volume and consistency
  const dataVolumeScore = Math.min(cycleLengths.length / 6, 1) // Max confidence at 6+ cycles
  const consistencyScore = Math.max(0, 1 - (standardDeviation / 7)) // Lower std dev = higher confidence
  const confidence = (dataVolumeScore * 0.6) + (consistencyScore * 0.4)

  // Regularity score (0-1, higher is more regular)
  const regularityScore = Math.max(0, 1 - (standardDeviation / 5))

  return {
    averageLength: Math.round(averageLength * 10) / 10,
    standardDeviation: Math.round(standardDeviation * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    dataPoints: cycleLengths.length,
    regularityScore: Math.round(regularityScore * 100) / 100
  }
}

/**
 * Generates predictions for the next 3 cycles
 */
export function generatePredictions(
  periodLogs: PeriodLog[],
  healthProfile: HealthProfile
): Prediction[] {
  const predictions: Prediction[] = []
  const stats = calculateCycleStats(periodLogs)
  
  if (periodLogs.length === 0) {
    // No data - use profile defaults
    const today = startOfDay(new Date())
    const baseDate = healthProfile.lastPeriodDate || today
    
    for (let cycle = 1; cycle <= 3; cycle++) {
      const periodStart = addDays(baseDate, (cycle - 1) * healthProfile.cycleLengthAvg)
      const ovulation = addDays(periodStart, healthProfile.cycleLengthAvg - healthProfile.lutealDays)
      const fertileStart = addDays(ovulation, -3)
      const fertileEnd = addDays(ovulation, 1)

      predictions.push(
        {
          id: `period-start-${cycle}`,
          date: periodStart,
          type: 'periodStart',
          confidence: 0.3, // Low confidence without data
          explanation: `Estimated based on your average cycle length of ${healthProfile.cycleLengthAvg} days. Confidence is low without historical data.`,
          createdAt: new Date()
        },
        {
          id: `fertile-start-${cycle}`,
          date: fertileStart,
          type: 'fertileStart',
          confidence: 0.2,
          explanation: `Fertile window typically starts 4 days before ovulation. Based on ${healthProfile.lutealDays}-day luteal phase.`,
          createdAt: new Date()
        },
        {
          id: `ovulation-${cycle}`,
          date: ovulation,
          type: 'ovulation',
          confidence: 0.2,
          explanation: `Ovulation estimated ${healthProfile.lutealDays} days before next period. This is an approximation without temperature data.`,
          createdAt: new Date()
        },
        {
          id: `fertile-end-${cycle}`,
          date: fertileEnd,
          type: 'fertileEnd',
          confidence: 0.2,
          explanation: `Fertile window typically ends 1 day after ovulation.`,
          createdAt: new Date()
        }
      )
    }
    
    return predictions
  }

  // Use historical data for predictions
  const lastPeriod = periodLogs
    .filter(p => p.startDate)
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())[0]

  if (!lastPeriod) return predictions

  const cycleLength = stats.averageLength
  const lutealDays = healthProfile.lutealDays

  for (let cycle = 1; cycle <= 3; cycle++) {
    const periodStart = addDays(lastPeriod.startDate, cycle * cycleLength)
    const ovulation = addDays(periodStart, cycleLength - lutealDays)
    const fertileStart = addDays(ovulation, -3)
    const fertileEnd = addDays(ovulation, 1)

    // Adjust confidence based on how far in the future and data quality
    const futureConfidenceDecay = Math.max(0.3, 1 - ((cycle - 1) * 0.2))
    const baseConfidence = stats.confidence * futureConfidenceDecay

    const getExplanation = (type: string) => {
      const dataQuality = stats.dataPoints >= 3 ? 'good' : 'limited'
      const regularity = stats.regularityScore > 0.8 ? 'very regular' : 
                        stats.regularityScore > 0.6 ? 'fairly regular' : 'irregular'
      
      switch (type) {
        case 'periodStart':
          return `Based on ${stats.dataPoints} cycles of ${dataQuality} data. Your cycles are ${regularity} with an average length of ${cycleLength} days (±${stats.standardDeviation} days).`
        case 'ovulation':
          return `Estimated ${lutealDays} days before your next period. This assumes a typical luteal phase length. Consider tracking basal body temperature for more accuracy.`
        case 'fertileStart':
          return `Fertile window starts ~4 days before ovulation when sperm can survive. Based on your ${regularity} ${cycleLength}-day cycles.`
        case 'fertileEnd':
          return `Fertile window ends ~24 hours after ovulation when the egg is no longer viable.`
        default:
          return `Prediction based on your cycle history.`
      }
    }

    predictions.push(
      {
        id: `period-start-${cycle}`,
        date: periodStart,
        type: 'periodStart',
        confidence: Math.round(baseConfidence * 100) / 100,
        explanation: getExplanation('periodStart'),
        createdAt: new Date()
      },
      {
        id: `fertile-start-${cycle}`,
        date: fertileStart,
        type: 'fertileStart',
        confidence: Math.round(baseConfidence * 0.8 * 100) / 100, // Slightly lower confidence
        explanation: getExplanation('fertileStart'),
        createdAt: new Date()
      },
      {
        id: `ovulation-${cycle}`,
        date: ovulation,
        type: 'ovulation',
        confidence: Math.round(baseConfidence * 0.7 * 100) / 100, // Lower confidence without BBT
        explanation: getExplanation('ovulation'),
        createdAt: new Date()
      },
      {
        id: `fertile-end-${cycle}`,
        date: fertileEnd,
        type: 'fertileEnd',
        confidence: Math.round(baseConfidence * 0.8 * 100) / 100,
        explanation: getExplanation('fertileEnd'),
        createdAt: new Date()
      }
    )
  }

  return predictions.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Gets the current cycle phase based on predictions and today's date
 */
export function getCurrentPhase(predictions: Prediction[]): {
  phase: 'menstrual' | 'follicular' | 'fertile' | 'luteal' | 'unknown'
  description: string
  daysUntilNext: number
  nextEvent: string
} {
  const today = startOfDay(new Date())
  const futurePredictions = predictions
    .filter(p => p.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const pastPredictions = predictions
    .filter(p => p.date < today)
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  if (futurePredictions.length === 0) {
    return {
      phase: 'unknown',
      description: 'Unable to determine current phase',
      daysUntilNext: 0,
      nextEvent: 'Log your period to get predictions'
    }
  }

  const nextPrediction = futurePredictions[0]
  const daysUntilNext = differenceInDays(nextPrediction.date, today)

  // Check if we're currently in a predicted period
  const recentPeriodStart = pastPredictions.find(p => p.type === 'periodStart')
  if (recentPeriodStart && differenceInDays(today, recentPeriodStart.date) <= 7) {
    return {
      phase: 'menstrual',
      description: 'You are currently in your menstrual phase',
      daysUntilNext,
      nextEvent: `${nextPrediction.type.replace('Start', '').replace('End', '')} in ${daysUntilNext} days`
    }
  }

  // Determine phase based on next prediction
  switch (nextPrediction.type) {
    case 'fertileStart':
      return {
        phase: 'follicular',
        description: 'You are in your follicular phase - your body is preparing for ovulation',
        daysUntilNext,
        nextEvent: `Fertile window starts in ${daysUntilNext} days`
      }
    case 'ovulation':
      return {
        phase: 'fertile',
        description: 'You are in your fertile window - highest chance of conception',
        daysUntilNext,
        nextEvent: `Ovulation in ${daysUntilNext} days`
      }
    case 'fertileEnd':
      return {
        phase: 'fertile',
        description: 'You are in your fertile window - ovulation is imminent',
        daysUntilNext,
        nextEvent: `Fertile window ends in ${daysUntilNext} days`
      }
    case 'periodStart':
      return {
        phase: 'luteal',
        description: 'You are in your luteal phase - your body is preparing for your next period',
        daysUntilNext,
        nextEvent: `Next period in ${daysUntilNext} days`
      }
    default:
      return {
        phase: 'unknown',
        description: 'Unable to determine current phase',
        daysUntilNext,
        nextEvent: 'Update your data for better predictions'
      }
  }
}

/**
 * Gets insights and recommendations based on cycle data
 */
export function getCycleInsights(
  periodLogs: PeriodLog[],
  stats: CycleStats
): Array<{ type: 'info' | 'warning' | 'tip'; message: string }> {
  const insights: Array<{ type: 'info' | 'warning' | 'tip'; message: string }> = []

  if (stats.dataPoints < 3) {
    insights.push({
      type: 'tip',
      message: 'Track at least 3 cycles to get more accurate predictions and insights.'
    })
  }

  if (stats.regularityScore < 0.5) {
    insights.push({
      type: 'warning',
      message: 'Your cycles are quite irregular. Consider consulting a healthcare provider if this continues.'
    })
  }

  if (stats.averageLength < 21 || stats.averageLength > 35) {
    insights.push({
      type: 'warning',
      message: `Your average cycle length is ${stats.averageLength} days. Normal cycles are typically 21-35 days. Consider consulting a healthcare provider.`
    })
  }

  if (stats.regularityScore > 0.8) {
    insights.push({
      type: 'info',
      message: 'Your cycles are very regular! This makes predictions more reliable.'
    })
  }

  if (stats.confidence > 0.8) {
    insights.push({
      type: 'info',
      message: 'High prediction confidence based on your consistent cycle data.'
    })
  }

  // Check for very long or short periods
  const recentPeriods = periodLogs
    .filter(p => p.startDate && p.endDate)
    .slice(-3)

  const longPeriods = recentPeriods.filter(p => {
    if (!p.endDate) return false
    return differenceInDays(p.endDate, p.startDate) > 7
  })

  if (longPeriods.length >= 2) {
    insights.push({
      type: 'warning',
      message: 'You\'ve had several periods lasting longer than 7 days. Consider consulting a healthcare provider.'
    })
  }

  const shortPeriods = recentPeriods.filter(p => {
    if (!p.endDate) return false
    return differenceInDays(p.endDate, p.startDate) < 2
  })

  if (shortPeriods.length >= 2) {
    insights.push({
      type: 'warning',
      message: 'You\'ve had several very short periods. Consider consulting a healthcare provider.'
    })
  }

  return insights
}
