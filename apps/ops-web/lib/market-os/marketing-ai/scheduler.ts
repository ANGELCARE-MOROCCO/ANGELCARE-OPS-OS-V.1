import type { MarketingAiFrequency } from './types'

type CalendarParts = { year: number; month: number; day: number; hour: number; minute: number; weekday: number }

function zonedParts(date: Date, timezone: string): CalendarParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  })
  const values = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]))
  const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    weekday: weekdays[values.weekday] ?? 0,
  }
}

function localToUtc(parts: Omit<CalendarParts, 'weekday'>, timezone: string) {
  const guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0)
  const observed = zonedParts(new Date(guess), timezone)
  const observedAsUtc = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, 0, 0)
  return new Date(guess - (observedAsUtc - guess))
}

function addLocalDays(parts: CalendarParts, days: number): CalendarParts {
  const value = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, parts.hour, parts.minute))
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate(), hour: value.getUTCHours(), minute: value.getUTCMinutes(), weekday: value.getUTCDay() }
}

function addLocalMonths(parts: CalendarParts, months: number, day: number): CalendarParts {
  const value = new Date(Date.UTC(parts.year, parts.month - 1 + months, day, parts.hour, parts.minute))
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate(), hour: value.getUTCHours(), minute: value.getUTCMinutes(), weekday: value.getUTCDay() }
}

export function calculateNextRun(input: {
  frequency: MarketingAiFrequency
  from?: Date
  timezone?: string
  hour?: number
  minute?: number
  dayOfWeek?: number | null
  dayOfMonth?: number | null
}) {
  const from = input.from || new Date()
  const timezone = input.timezone || 'Africa/Casablanca'
  const hour = input.hour ?? 8
  const minute = input.minute ?? 0
  if (input.frequency === 'manual') return null
  if (input.frequency === 'hourly') return new Date(from.getTime() + 60 * 60 * 1000).toISOString()
  if (input.frequency === 'every_4_hours') return new Date(from.getTime() + 4 * 60 * 60 * 1000).toISOString()

  const nowLocal = zonedParts(from, timezone)
  let candidate: CalendarParts = { ...nowLocal, hour, minute }
  const candidateUtc = () => localToUtc(candidate, timezone)

  if (input.frequency === 'daily' || input.frequency === 'weekdays') {
    if (candidateUtc() <= from) candidate = addLocalDays(candidate, 1)
    if (input.frequency === 'weekdays') {
      while ([0, 6].includes(candidate.weekday)) candidate = addLocalDays(candidate, 1)
    }
    return candidateUtc().toISOString()
  }

  if (input.frequency === 'weekly' || input.frequency === 'biweekly') {
    const targetDay = input.dayOfWeek ?? 1
    let delta = (targetDay - nowLocal.weekday + 7) % 7
    candidate = addLocalDays(candidate, delta)
    if (candidateUtc() <= from) candidate = addLocalDays(candidate, 7)
    if (input.frequency === 'biweekly') candidate = addLocalDays(candidate, 7)
    return candidateUtc().toISOString()
  }

  if (input.frequency === 'monthly' || input.frequency === 'quarterly') {
    const day = Math.min(28, Math.max(1, input.dayOfMonth ?? 1))
    candidate = { ...candidate, day }
    if (candidateUtc() <= from) candidate = addLocalMonths(candidate, input.frequency === 'quarterly' ? 3 : 1, day)
    return candidateUtc().toISOString()
  }

  return null
}
