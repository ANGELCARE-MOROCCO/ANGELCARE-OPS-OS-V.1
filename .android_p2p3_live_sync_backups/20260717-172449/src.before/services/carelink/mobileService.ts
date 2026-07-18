import {requestJson, type HttpResult} from '../api/httpClient'

export type CareLinkMobileWorkspace = {
  source?: string
  generatedAt?: string
  agent?: Record<string, unknown> | null
  profile?: Record<string, unknown> | null
  stats?: {
    todayMissions?: number
    weekHours?: number
    reliabilityScore?: number
    performanceScore?: number
    noShowCount?: number
    cancellationCount?: number
    completedCount?: number
    pendingReports?: number
    unreadMessages?: number
    criticalAlerts?: number
  }
  readiness?: {
    score?: number
    status?: string
    blockers?: string[]
    warnings?: string[]
    nextAction?: string
  }
  payments?: {
    currency?: 'MAD'
    earned?: number
    pendingValidation?: number
    paid?: number
    bonuses?: number
    transport?: number
    allowances?: number
    upcomingPayment?: number
  }
  alerts?: Array<Record<string, unknown>>
  notifications?: Array<Record<string, unknown>>
  messages?: Array<Record<string, unknown>>
  history?: Array<Record<string, unknown>>
  support?: Array<Record<string, unknown>>
  schedule?: Array<Record<string, unknown>>
  calendar?: Record<string, unknown>
  records?: Array<Record<string, unknown>>
  todayMissions?: Array<Record<string, unknown>>
  upcomingMissions?: Array<Record<string, unknown>>
  activeMission?: Record<string, unknown> | null
  nextMission?: Record<string, unknown> | null
}

function unwrapWorkspace(data: unknown): CareLinkMobileWorkspace | null {
  if (!data || typeof data !== 'object') return null
  const payload = data as Record<string, unknown>

  if ('data' in payload && payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data as CareLinkMobileWorkspace
  }

  return payload as CareLinkMobileWorkspace
}

export async function fetchCareLinkMobileWorkspace(): Promise<HttpResult<CareLinkMobileWorkspace | Record<string, unknown>>> {
  return requestJson('/api/carelink/mobile', {method: 'GET'})
}

export async function fetchCareLinkDashboard(): Promise<HttpResult<CareLinkMobileWorkspace | Record<string, unknown>>> {
  return requestJson('/api/carelink/dashboard', {method: 'GET'})
}

export function extractCareLinkWorkspace(data: unknown): CareLinkMobileWorkspace | null {
  return unwrapWorkspace(data)
}
