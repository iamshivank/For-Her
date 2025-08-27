import { z } from 'zod'

// Core data models with Zod validation

export const UserPrefsSchema = z.object({
  id: z.string().default('user-prefs'),
  theme: z.enum(['light', 'dark', 'system', 'high-contrast']).default('system'),
  locale: z.string().default('en'),
  discreetMode: z.boolean().default(false),
  notificationPrefs: z.object({
    period: z.boolean().default(true),
    fertile: z.boolean().default(true),
    pill: z.boolean().default(false),
    hydration: z.boolean().default(false),
    exercise: z.boolean().default(false),
    custom: z.boolean().default(true),
    quietHours: z.object({
      enabled: z.boolean().default(false),
      start: z.string().default('22:00'),
      end: z.string().default('07:00'),
    }).default({}),
  }).default({}),
  consentFlags: z.object({
    analytics: z.boolean().default(false),
    cloudSync: z.boolean().default(false),
    crashReporting: z.boolean().default(false),
  }).default({}),
  accessibility: z.object({
    reducedMotion: z.boolean().default(false),
    highContrast: z.boolean().default(false),
    fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
  }).default({}),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
})

export const HealthProfileSchema = z.object({
  id: z.string().default('health-profile'),
  cycleLengthAvg: z.number().min(20).max(40).default(28),
  cycleLengthStd: z.number().min(0).max(10).default(2),
  lutealDays: z.number().min(10).max(16).default(14),
  goals: z.enum(['track', 'ttc', 'pregnant', 'postpartum', 'perimenopause']).default('track'),
  contraception: z.enum(['none', 'pill', 'iud', 'condom', 'patch', 'ring', 'injection', 'implant', 'other']).default('none'),
  lastPeriodDate: z.date().optional(),
  pregnancyDueDate: z.date().optional(),
  birthDate: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
})

export const PeriodLogSchema = z.object({
  id: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  flow: z.number().min(1).max(5).optional(), // 1=spotting, 5=very heavy
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
})

export const SymptomLogSchema = z.object({
  id: z.string(),
  date: z.date(),
  tags: z.array(z.string()),
  intensity: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
})

export const PredictionSchema = z.object({
  id: z.string(),
  date: z.date(),
  type: z.enum(['periodStart', 'fertileStart', 'fertileEnd', 'ovulation']),
  confidence: z.number().min(0).max(1),
  explanation: z.string(),
  createdAt: z.date().default(() => new Date()),
})

export const BreathingSessionSchema = z.object({
  id: z.string(),
  date: z.date(),
  protocol: z.enum(['box', '4-7-8', 'coherent', 'custom']),
  durationSec: z.number().min(30).max(1800), // 30 seconds to 30 minutes
  cycles: z.number().min(1).max(100),
  perceivedPainBefore: z.number().min(1).max(10).optional(),
  perceivedPainAfter: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
})

export const ReminderSchema = z.object({
  id: z.string(),
  type: z.enum(['period', 'pill', 'hydration', 'exercise', 'custom']),
  title: z.string(),
  description: z.string().optional(),
  schedule: z.string(), // RRULE format
  enabled: z.boolean().default(true),
  lastFired: z.date().optional(),
  nextFire: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
})

export const ShareTokenSchema = z.object({
  id: z.string(),
  scope: z.array(z.enum(['nextPeriod', 'fullCalendar', 'symptoms', 'predictions'])),
  expiresAt: z.date(),
  revoked: z.boolean().default(false),
  viewCount: z.number().default(0),
  maxViews: z.number().optional(),
  createdAt: z.date().default(() => new Date()),
})

export const ContentItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  content: z.string(), // Markdown content
  tags: z.array(z.string()),
  modePhase: z.array(z.string()), // Which modes/phases this applies to
  readingTime: z.number(), // Estimated reading time in minutes
  featured: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
})

export const MoodLogSchema = z.object({
  id: z.string(),
  date: z.date(),
  mood: z.number().min(1).max(5), // 1=very low, 5=very high
  energy: z.number().min(1).max(5).optional(),
  stress: z.number().min(1).max(5).optional(),
  gratitude: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
})

// Type exports
export type UserPrefs = z.infer<typeof UserPrefsSchema>
export type HealthProfile = z.infer<typeof HealthProfileSchema>
export type PeriodLog = z.infer<typeof PeriodLogSchema>
export type SymptomLog = z.infer<typeof SymptomLogSchema>
export type Prediction = z.infer<typeof PredictionSchema>
export type BreathingSession = z.infer<typeof BreathingSessionSchema>
export type Reminder = z.infer<typeof ReminderSchema>
export type ShareToken = z.infer<typeof ShareTokenSchema>
export type ContentItem = z.infer<typeof ContentItemSchema>
export type MoodLog = z.infer<typeof MoodLogSchema>

// Symptom categories for UI
export const SYMPTOM_CATEGORIES = {
  physical: [
    'cramps', 'headache', 'backache', 'breast-tenderness', 'bloating', 
    'acne', 'fatigue', 'nausea', 'dizziness', 'hot-flashes'
  ],
  emotional: [
    'mood-swings', 'irritability', 'anxiety', 'depression', 'euphoria',
    'emotional', 'sensitive', 'confident', 'motivated'
  ],
  digestive: [
    'appetite-increase', 'appetite-decrease', 'cravings-sweet', 'cravings-salty',
    'constipation', 'diarrhea', 'gas', 'food-aversion'
  ],
  sleep: [
    'insomnia', 'vivid-dreams', 'restless-sleep', 'oversleeping', 'night-sweats'
  ],
  other: [
    'discharge-light', 'discharge-heavy', 'discharge-sticky', 'discharge-creamy',
    'cervix-high', 'cervix-low', 'cervix-soft', 'cervix-firm'
  ]
} as const

// Flow intensity descriptions
export const FLOW_DESCRIPTIONS = {
  1: 'Spotting',
  2: 'Light',
  3: 'Medium',
  4: 'Heavy',
  5: 'Very Heavy'
} as const

// Breathing protocols
export const BREATHING_PROTOCOLS = {
  box: {
    name: 'Box Breathing',
    description: '4-4-4-4 pattern for stress relief',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
  },
  '4-7-8': {
    name: '4-7-8 Breathing',
    description: 'Inhale 4, hold 7, exhale 8 for sleep',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
  },
  coherent: {
    name: 'Coherent Breathing',
    description: '5.5 BPM for heart rate variability',
    inhale: 5.5,
    hold1: 0,
    exhale: 5.5,
    hold2: 0,
  }
} as const
