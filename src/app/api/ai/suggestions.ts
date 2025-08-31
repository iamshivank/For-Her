export type AISuggestionInput = {
  periodLogs: Array<{ startDate: string; endDate?: string; flow?: number }>
  symptomLogs: Array<{ date: string; tags: string[]; intensity?: number }>
  moodLogs: Array<{ date: string; mood: number }>
  profile: { cycleLengthAvg?: number; lutealDays?: number; goals?: string }
}

export type AISuggestion = {
  title: string
  text: string
}

