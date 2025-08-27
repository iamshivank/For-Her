import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { 
  UserPrefs, 
  HealthProfile, 
  PeriodLog, 
  SymptomLog, 
  Prediction, 
  BreathingSession, 
  Reminder, 
  MoodLog 
} from './types'
import { db } from './database'
import { generatePredictions, calculateCycleStats, getCurrentPhase } from './predictions'

interface AppState {
  // Authentication & Security
  isAuthenticated: boolean
  passphrase: string | null
  
  // User Data
  userPrefs: UserPrefs | null
  healthProfile: HealthProfile | null
  
  // Tracking Data
  periodLogs: PeriodLog[]
  symptomLogs: SymptomLog[]
  moodLogs: MoodLog[]
  breathingSessions: BreathingSession[]
  
  // Predictions & Insights
  predictions: Prediction[]
  currentPhase: {
    phase: 'menstrual' | 'follicular' | 'fertile' | 'luteal' | 'unknown'
    description: string
    daysUntilNext: number
    nextEvent: string
  }
  
  // Reminders
  reminders: Reminder[]
  
  // UI State
  isLoading: boolean
  error: string | null
  onboardingComplete: boolean
  
  // Actions
  authenticate: (passphrase: string) => Promise<boolean>
  logout: () => void
  initializeApp: () => Promise<void>
  
  // User Preferences
  updateUserPrefs: (updates: Partial<UserPrefs>) => Promise<void>
  
  // Health Profile
  updateHealthProfile: (updates: Partial<HealthProfile>) => Promise<void>
  
  // Period Tracking
  addPeriodLog: (log: Omit<PeriodLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updatePeriodLog: (id: string, updates: Partial<PeriodLog>) => Promise<void>
  deletePeriodLog: (id: string) => Promise<void>
  
  // Symptom Tracking
  addSymptomLog: (log: Omit<SymptomLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateSymptomLog: (id: string, updates: Partial<SymptomLog>) => Promise<void>
  deleteSymptomLog: (id: string) => Promise<void>
  
  // Mood Tracking
  addMoodLog: (log: Omit<MoodLog, 'id' | 'createdAt'>) => Promise<void>
  
  // Breathing Sessions
  addBreathingSession: (session: Omit<BreathingSession, 'id' | 'createdAt'>) => Promise<void>
  
  // Predictions
  refreshPredictions: () => Promise<void>
  
  // Reminders
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>
  deleteReminder: (id: string) => Promise<void>
  
  // Data Management
  exportData: () => Promise<any>
  importData: (data: any) => Promise<void>
  wipeAllData: () => Promise<void>
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      isAuthenticated: false,
      passphrase: null,
      userPrefs: null,
      healthProfile: null,
      periodLogs: [],
      symptomLogs: [],
      moodLogs: [],
      breathingSessions: [],
      predictions: [],
      currentPhase: {
        phase: 'unknown',
        description: 'Log your period to get started',
        daysUntilNext: 0,
        nextEvent: 'Track your first period'
      },
      reminders: [],
      isLoading: false,
      error: null,
      onboardingComplete: false,

      // Authentication
      authenticate: async (passphrase: string) => {
        try {
          set({ isLoading: true, error: null })
          
          // Try to decrypt health profile to verify passphrase
          const healthProfile = await db.getHealthProfile(passphrase)
          
          set({ 
            isAuthenticated: true, 
            passphrase,
            healthProfile,
            isLoading: false 
          })
          
          // Load all encrypted data
          await get().initializeApp()
          
          return true
        } catch (error) {
          set({ 
            error: 'Invalid passphrase or corrupted data', 
            isLoading: false 
          })
          return false
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          passphrase: null,
          healthProfile: null,
          periodLogs: [],
          symptomLogs: [],
          moodLogs: [],
          breathingSessions: [],
          predictions: [],
          currentPhase: {
            phase: 'unknown',
            description: 'Log your period to get started',
            daysUntilNext: 0,
            nextEvent: 'Track your first period'
          }
        })
      },

      // Initialize App
      initializeApp: async () => {
        try {
          set({ isLoading: true, error: null })
          
          const { passphrase } = get()
          if (!passphrase) {
            throw new Error('No passphrase available')
          }

          // Load user preferences (not encrypted)
          const userPrefs = await db.getUserPrefs()
          
          // Load encrypted data
          const [periodLogs, symptomLogs, moodLogs, breathingSessions, reminders] = await Promise.all([
            db.getPeriodLogs(passphrase),
            db.getSymptomLogs(passphrase),
            db.getMoodLogs(passphrase),
            db.getBreathingSessions(passphrase),
            db.getReminders()
          ])

          set({
            userPrefs,
            periodLogs,
            symptomLogs,
            moodLogs,
            breathingSessions,
            reminders,
            onboardingComplete: userPrefs.id !== undefined,
            isLoading: false
          })

          // Generate predictions
          await get().refreshPredictions()
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize app',
            isLoading: false 
          })
        }
      },

      // User Preferences
      updateUserPrefs: async (updates: Partial<UserPrefs>) => {
        try {
          await db.updateUserPrefs(updates)
          const updatedPrefs = await db.getUserPrefs()
          set({ userPrefs: updatedPrefs })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update preferences' })
        }
      },

      // Health Profile
      updateHealthProfile: async (updates: Partial<HealthProfile>) => {
        try {
          const { passphrase } = get()
          if (!passphrase) throw new Error('Not authenticated')
          
          await db.updateHealthProfile(updates, passphrase)
          const updatedProfile = await db.getHealthProfile(passphrase)
          set({ healthProfile: updatedProfile })
          
          // Refresh predictions after profile changes
          await get().refreshPredictions()
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update health profile' })
        }
      },

      // Period Tracking
      addPeriodLog: async (log: Omit<PeriodLog, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
          const { passphrase } = get()
          if (!passphrase) throw new Error('Not authenticated')
          
          await db.addPeriodLog(log, passphrase)
          const updatedLogs = await db.getPeriodLogs(passphrase)
          set({ periodLogs: updatedLogs })
          
          await get().refreshPredictions()
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add period log' })
        }
      },

      updatePeriodLog: async (id: string, updates: Partial<PeriodLog>) => {
        try {
          const { passphrase, periodLogs } = get()
          if (!passphrase) throw new Error('Not authenticated')
          
          const existingLog = periodLogs.find(log => log.id === id)
          if (!existingLog) throw new Error('Period log not found')
          
          const updatedLog = { ...existingLog, ...updates, updatedAt: new Date() }
          await db.putEncrypted('periodLogs', updatedLog, passphrase)
          
          const updatedLogs = await db.getPeriodLogs(passphrase)
          set({ periodLogs: updatedLogs })
          
          await get().refreshPredictions()
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update period log' })
        }
      },

      deletePeriodLog: async (id: string) => {
        try {
          const { passphrase } = get()
          if (!passphrase) throw new Error('Not authenticated')
          
          await db.periodLogs.delete(id)
          const updatedLogs = await db.getPeriodLogs(passphrase)
          set({ periodLogs: updatedLogs })
          
          await get().refreshPredictions()
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete period log' })
        }
      },

      // Symptom Tracking
      addSymptomLog: async (log: Omit<SymptomLog, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
          const { passphrase } = get()
          if (!passphrase) throw new Error('Not authenticated')
          
          await db.addSymptomLog(log, passphrase)
          const updatedLogs = await db.getSymptomLogs(passphrase)
          set({ symptomLogs: updatedLogs })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add symptom log' })
        }
      },

      updateSymptomLog: async (id: string, updates: Partial<SymptomLog>) => {
        try {
          const { passphrase, symptomLogs } = get()
          if (!passphrase) throw new Error('Not authenticated')
          
          const existingLog = symptomLogs.find(log => log.id === id)
          if (!existingLog) throw new Error('Symptom log not found')
          
          const updatedLog = { ...existingLog, ...updates, updatedAt: new Date() }
          await db.putEncrypted('symptomLogs', updatedLog, passphrase)
          
          const updatedLogs = await db.getSymptomLogs(passphrase)
          set({ symptomLogs: updatedLogs })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update symptom log' })
        }
      },

      deleteSymptomLog: async (id: string) => {
        try {
          const { passphrase } = get()
          if (!passphrase) throw new Error('Not authenticated')
          
          await db.symptomLogs.delete(id)
          const updatedLogs = await db.getSymptomLogs(passphrase)
          set({ symptomLogs: updatedLogs })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete symptom log' })
        }
      },

      // Mood Tracking
      addMoodLog: async (log: Omit<MoodLog, 'id' | 'createdAt'>) => {
        try {
          const { passphrase } = get()
          if (!passphrase) throw new Error('Not authenticated')
          
          await db.addMoodLog(log, passphrase)
          const updatedLogs = await db.getMoodLogs(passphrase)
          set({ moodLogs: updatedLogs })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add mood log' })
        }
      },

      // Breathing Sessions
      addBreathingSession: async (session: Omit<BreathingSession, 'id' | 'createdAt'>) => {
        try {
          const { passphrase } = get()
          if (!passphrase) throw new Error('Not authenticated')
          
          await db.addBreathingSession(session, passphrase)
          const updatedSessions = await db.getBreathingSessions(passphrase)
          set({ breathingSessions: updatedSessions })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add breathing session' })
        }
      },

      // Predictions
      refreshPredictions: async () => {
        try {
          const { periodLogs, healthProfile } = get()
          if (!healthProfile) return
          
          const predictions = generatePredictions(periodLogs, healthProfile)
          const currentPhase = getCurrentPhase(predictions)
          
          await db.savePredictions(predictions)
          set({ predictions, currentPhase })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to refresh predictions' })
        }
      },

      // Reminders
      addReminder: async (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
          await db.addReminder(reminder)
          const updatedReminders = await db.getReminders()
          set({ reminders: updatedReminders })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to add reminder' })
        }
      },

      updateReminder: async (id: string, updates: Partial<Reminder>) => {
        try {
          await db.updateReminder(id, updates)
          const updatedReminders = await db.getReminders()
          set({ reminders: updatedReminders })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update reminder' })
        }
      },

      deleteReminder: async (id: string) => {
        try {
          await db.reminders.delete(id)
          const updatedReminders = await db.getReminders()
          set({ reminders: updatedReminders })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete reminder' })
        }
      },

      // Data Management
      exportData: async () => {
        try {
          const { passphrase } = get()
          if (!passphrase) throw new Error('Not authenticated')
          
          return await db.exportData(passphrase)
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to export data' })
          throw error
        }
      },

      importData: async (data: any) => {
        try {
          const { passphrase } = get()
          if (!passphrase) throw new Error('Not authenticated')
          
          set({ isLoading: true })
          await db.importData(data, passphrase)
          await get().initializeApp()
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to import data',
            isLoading: false 
          })
          throw error
        }
      },

      wipeAllData: async () => {
        try {
          set({ isLoading: true })
          await db.wipeAllData()
          set({
            isAuthenticated: false,
            passphrase: null,
            userPrefs: null,
            healthProfile: null,
            periodLogs: [],
            symptomLogs: [],
            moodLogs: [],
            breathingSessions: [],
            predictions: [],
            currentPhase: {
              phase: 'unknown',
              description: 'Log your period to get started',
              daysUntilNext: 0,
              nextEvent: 'Track your first period'
            },
            reminders: [],
            onboardingComplete: false,
            isLoading: false
          })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to wipe data',
            isLoading: false 
          })
        }
      }
    }),
    {
      name: 'cyclewise-app-state',
      storage: createJSONStorage(() => localStorage),
      // Only persist non-sensitive UI state
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete,
        userPrefs: state.userPrefs ? {
          theme: state.userPrefs.theme,
          locale: state.userPrefs.locale,
          discreetMode: state.userPrefs.discreetMode,
          accessibility: state.userPrefs.accessibility
        } : null
      })
    }
  )
)
