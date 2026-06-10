import type { CareLinkMission } from './types'

export interface ScheduleConflict {
  type: 'overlap' | 'travel_buffer' | 'rest_buffer' | 'compliance'
  severity: 'warning' | 'blocked'
  message: string
  missionIds: string[]
}

export function detectScheduleConflicts(missions: CareLinkMission[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []
  const sorted = [...missions].sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]
    const currentEnd = new Date(current.scheduledEnd).getTime()
    const nextStart = new Date(next.scheduledStart).getTime()
    const bufferMinutes = Math.round((nextStart - currentEnd) / 60000)
    if (bufferMinutes < 0) conflicts.push({ type: 'overlap', severity: 'blocked', message: `Chevauchement entre ${current.code} et ${next.code}`, missionIds: [current.id, next.id] })
    else if (bufferMinutes < 45) conflicts.push({ type: 'travel_buffer', severity: 'warning', message: `Marge déplacement faible: ${bufferMinutes} minutes`, missionIds: [current.id, next.id] })
  }
  return conflicts
}
