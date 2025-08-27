import Dexie, { type EntityTable } from 'dexie'
import {
  UserPrefs,
  HealthProfile,
  PeriodLog,
  SymptomLog,
  Prediction,
  BreathingSession,
  Reminder,
  ShareToken,
  ContentItem,
  MoodLog,
  UserPrefsSchema,
  HealthProfileSchema,
  PeriodLogSchema,
  SymptomLogSchema,
  PredictionSchema,
  BreathingSessionSchema,
  ReminderSchema,
  ShareTokenSchema,
  ContentItemSchema,
  MoodLogSchema
} from './types'
import { encrypt, decrypt, EncryptedData, encryptObject, decryptObject } from './crypto'

// Tables that should be encrypted
const ENCRYPTED_TABLES = ['periodLogs', 'symptomLogs', 'moodLogs', 'breathingSessions', 'healthProfile']

interface EncryptedRecord {
  id: string
  encrypted: EncryptedData
  createdAt: Date
  updatedAt: Date
}

class CycleWiseDB extends Dexie {
  userPrefs!: EntityTable<UserPrefs, 'id'>
  healthProfile!: EntityTable<HealthProfile | EncryptedRecord, 'id'>
  periodLogs!: EntityTable<PeriodLog | EncryptedRecord, 'id'>
  symptomLogs!: EntityTable<SymptomLog | EncryptedRecord, 'id'>
  predictions!: EntityTable<Prediction, 'id'>
  breathingSessions!: EntityTable<BreathingSession | EncryptedRecord, 'id'>
  reminders!: EntityTable<Reminder, 'id'>
  shareTokens!: EntityTable<ShareToken, 'id'>
  contentItems!: EntityTable<ContentItem, 'id'>
  moodLogs!: EntityTable<MoodLog | EncryptedRecord, 'id'>

  constructor() {
    super('CycleWiseDB')

    this.version(1).stores({
      userPrefs: 'id, theme, locale, createdAt, updatedAt',
      healthProfile: 'id, goals, createdAt, updatedAt',
      periodLogs: 'id, startDate, endDate, createdAt, updatedAt',
      symptomLogs: 'id, date, tags, createdAt, updatedAt',
      predictions: 'id, date, type, confidence, createdAt',
      breathingSessions: 'id, date, protocol, durationSec, createdAt',
      reminders: 'id, type, enabled, nextFire, createdAt, updatedAt',
      shareTokens: 'id, expiresAt, revoked, createdAt',
      contentItems: 'id, slug, tags, featured, createdAt, updatedAt',
      moodLogs: 'id, date, mood, createdAt'
    })

    // Validation hooks
    this.userPrefs.hook('creating', (primKey, obj, trans) => {
      const validated = UserPrefsSchema.parse(obj)
      Object.assign(obj, validated)
    })

    this.userPrefs.hook('updating', (modifications: Partial<UserPrefs>, primKey, obj, trans) => {
      if (modifications.updatedAt === undefined) {
        modifications.updatedAt = new Date()
      }
    })

    // Add similar hooks for other tables
    this.reminders.hook('creating', (primKey, obj, trans) => {
      const validated = ReminderSchema.parse(obj)
      Object.assign(obj, validated)
    })
  }

  // Encryption-aware methods
  async getDecrypted<T extends { id: string }>(
    tableName: keyof CycleWiseDB,
    id: string,
    passphrase: string,
    schema: any
  ): Promise<T | undefined> {
    const table = this[tableName] as EntityTable<T | EncryptedRecord, 'id'>
    const record = await table.get(id as any)

    if (!record) return undefined

    if (ENCRYPTED_TABLES.includes(tableName) && 'encrypted' in record) {
      const decrypted = await decryptObject<T>(record.encrypted, passphrase)
      return schema.parse(decrypted)
    }

    return record as T
  }

  async putEncrypted<T extends { id: string; createdAt?: Date }>(
    tableName: keyof CycleWiseDB,
    data: T,
    passphrase: string
  ): Promise<string> {
    const table = this[tableName] as EntityTable<T | EncryptedRecord, 'id'>

    if (ENCRYPTED_TABLES.includes(tableName)) {
      const encrypted = await encryptObject(data, passphrase)
      const record: EncryptedRecord = {
        id: (data as any).id,
        encrypted,
        createdAt: (data as any).createdAt || new Date(),
        updatedAt: new Date()
      }
      return table.put(record as any)
    }

    return table.put(data as any)
  }

  async getAllDecrypted<T extends { id: string }>(
    tableName: keyof CycleWiseDB,
    passphrase: string,
    schema: any
  ): Promise<T[]> {
    const table = this[tableName] as EntityTable<T | EncryptedRecord, 'id'>
    const records = await table.toArray()

    if (!ENCRYPTED_TABLES.includes(tableName)) {
      return records as T[]
    }

    const decrypted: T[] = []
    for (const record of records) {
      if ('encrypted' in record) {
        try {
          const data = await decryptObject<T>(record.encrypted, passphrase)
          decrypted.push(schema.parse(data))
        } catch (error) {
          console.error(`Failed to decrypt record ${record.id}:`, error)
        }
      }
    }

    return decrypted
  }

  // Convenience methods for common operations
  async getUserPrefs(): Promise<UserPrefs> {
    let prefs = await this.userPrefs.get('user-prefs')
    if (!prefs) {
      prefs = UserPrefsSchema.parse({})
      await this.userPrefs.put(prefs)
    }
    return prefs
  }

  async updateUserPrefs(updates: Partial<UserPrefs>): Promise<void> {
    await this.userPrefs.update('user-prefs', {
      ...updates,
      updatedAt: new Date()
    })
  }

  async getHealthProfile(passphrase: string): Promise<HealthProfile> {
    let profile = await this.getDecrypted<HealthProfile>(
      'healthProfile',
      'health-profile',
      passphrase,
      HealthProfileSchema
    )

    if (!profile) {
      profile = HealthProfileSchema.parse({})
      await this.putEncrypted('healthProfile', profile, passphrase)
    }

    return profile
  }

  async updateHealthProfile(updates: Partial<HealthProfile>, passphrase: string): Promise<void> {
    const current = await this.getHealthProfile(passphrase)
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date()
    }
    await this.putEncrypted('healthProfile', updated, passphrase)
  }

  async addPeriodLog(log: Omit<PeriodLog, 'id' | 'createdAt' | 'updatedAt'>, passphrase: string): Promise<string> {
    const id = `period-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const periodLog = PeriodLogSchema.parse({
      ...log,
      id
    })
    await this.putEncrypted('periodLogs', periodLog, passphrase)
    return id
  }

  async getPeriodLogs(passphrase: string): Promise<PeriodLog[]> {
    return this.getAllDecrypted<PeriodLog>('periodLogs', passphrase, PeriodLogSchema)
  }

  async addSymptomLog(log: Omit<SymptomLog, 'id' | 'createdAt' | 'updatedAt'>, passphrase: string): Promise<string> {
    const id = `symptom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const symptomLog = SymptomLogSchema.parse({
      ...log,
      id
    })
    await this.putEncrypted('symptomLogs', symptomLog, passphrase)
    return id
  }

  async getSymptomLogs(passphrase: string): Promise<SymptomLog[]> {
    return this.getAllDecrypted<SymptomLog>('symptomLogs', passphrase, SymptomLogSchema)
  }

  async addBreathingSession(session: Omit<BreathingSession, 'id' | 'createdAt'>, passphrase: string): Promise<string> {
    const id = `breathing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const breathingSession = BreathingSessionSchema.parse({
      ...session,
      id
    })
    await this.putEncrypted('breathingSessions', breathingSession, passphrase)
    return id
  }

  async getBreathingSessions(passphrase: string): Promise<BreathingSession[]> {
    return this.getAllDecrypted<BreathingSession>('breathingSessions', passphrase, BreathingSessionSchema)
  }

  async addMoodLog(log: Omit<MoodLog, 'id' | 'createdAt'>, passphrase: string): Promise<string> {
    const id = `mood-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const moodLog = MoodLogSchema.parse({
      ...log,
      id
    })
    await this.putEncrypted('moodLogs', moodLog, passphrase)
    return id
  }

  async getMoodLogs(passphrase: string): Promise<MoodLog[]> {
    return this.getAllDecrypted<MoodLog>('moodLogs', passphrase, MoodLogSchema)
  }

  // Prediction management
  async savePredictions(predictions: Prediction[]): Promise<void> {
    await this.predictions.clear()
    await this.predictions.bulkAdd(predictions)
  }

  async getPredictions(): Promise<Prediction[]> {
    return this.predictions.orderBy('date').toArray()
  }

  // Reminder management
  async addReminder(reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newReminder = ReminderSchema.parse({
      ...reminder,
      id
    })
    await this.reminders.put(newReminder)
    return id
  }

  async getReminders(): Promise<Reminder[]> {
    return this.reminders.where('enabled').equals(1).toArray()
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<void> {
    await this.reminders.update(id, {
      ...updates,
      updatedAt: new Date()
    })
  }

  // Data export/import
  async exportData(passphrase: string): Promise<any> {
    const [
      userPrefs,
      healthProfile,
      periodLogs,
      symptomLogs,
      moodLogs,
      breathingSessions,
      predictions,
      reminders
    ] = await Promise.all([
      this.getUserPrefs(),
      this.getHealthProfile(passphrase),
      this.getPeriodLogs(passphrase),
      this.getSymptomLogs(passphrase),
      this.getMoodLogs(passphrase),
      this.getBreathingSessions(passphrase),
      this.getPredictions(),
      this.getReminders()
    ])

    return {
      version: 1,
      exportDate: new Date().toISOString(),
      data: {
        userPrefs,
        healthProfile,
        periodLogs,
        symptomLogs,
        moodLogs,
        breathingSessions,
        predictions,
        reminders
      }
    }
  }

  async importData(exportData: any, passphrase: string): Promise<void> {
    const { data } = exportData

    await this.transaction('rw', [
      this.userPrefs,
      this.healthProfile,
      this.periodLogs,
      this.symptomLogs,
      this.moodLogs,
      this.breathingSessions,
      this.predictions,
      this.reminders
    ], async () => {
      // Clear existing data
      await Promise.all([
        this.userPrefs.clear(),
        this.healthProfile.clear(),
        this.periodLogs.clear(),
        this.symptomLogs.clear(),
        this.moodLogs.clear(),
        this.breathingSessions.clear(),
        this.predictions.clear(),
        this.reminders.clear()
      ])

      // Import new data
      if (data.userPrefs) {
        await this.userPrefs.put(data.userPrefs)
      }

      if (data.healthProfile) {
        await this.putEncrypted('healthProfile', data.healthProfile, passphrase)
      }

      if (data.periodLogs) {
        for (const log of data.periodLogs) {
          await this.putEncrypted('periodLogs', log, passphrase)
        }
      }

      if (data.symptomLogs) {
        for (const log of data.symptomLogs) {
          await this.putEncrypted('symptomLogs', log, passphrase)
        }
      }

      if (data.moodLogs) {
        for (const log of data.moodLogs) {
          await this.putEncrypted('moodLogs', log, passphrase)
        }
      }

      if (data.breathingSessions) {
        for (const session of data.breathingSessions) {
          await this.putEncrypted('breathingSessions', session, passphrase)
        }
      }

      if (data.predictions) {
        await this.predictions.bulkAdd(data.predictions)
      }

      if (data.reminders) {
        await this.reminders.bulkAdd(data.reminders)
      }
    })
  }

  // Wipe all data
  async wipeAllData(): Promise<void> {
    await this.delete()
    await this.open()
  }
}

// Singleton instance
export const db = new CycleWiseDB()
