import { serviceDesignRequest } from '@/components/carelink/service-design/feedback/client'
import type { MasteryDomain, MasteryPayload } from './types'

const base = '/api/carelink-ops/service-design/mastery'


export function listMastery(domain: MasteryDomain) {
  return serviceDesignRequest<{ domain: MasteryDomain; label: string; records: Record<string, any>[] }>(`${base}/${domain}`)
}

export function loadMastery(domain: MasteryDomain, id: string) {
  return serviceDesignRequest<MasteryPayload>(`${base}/${domain}/${encodeURIComponent(id)}`)
}

export function saveMastery(domain: MasteryDomain, id: string, patch: Record<string, unknown>) {
  return serviceDesignRequest<Record<string, unknown>>(`${base}/${domain}/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export function deleteMastery(domain: MasteryDomain, id: string) {
  return serviceDesignRequest<{ deleted: number }>(`${base}/${domain}/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function masteryAction<T = Record<string, unknown>>(domain: MasteryDomain, id: string, action: string, input: Record<string, unknown> = {}) {
  return serviceDesignRequest<T>(`${base}/${domain}/${encodeURIComponent(id)}/action`, { method: 'POST', body: JSON.stringify({ action, ...input }) })
}
