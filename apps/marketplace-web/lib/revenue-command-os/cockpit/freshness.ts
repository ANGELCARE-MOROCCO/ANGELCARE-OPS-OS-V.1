import type { DataFreshness, FreshnessState } from './types'

export function freshness(source: string, observedAt?: string | null, staleAfterMinutes = 60): DataFreshness {
  const refreshedAt = new Date().toISOString()
  if (!observedAt) return { state: 'unknown', refreshedAt, source, message: 'Aucune date source disponible.' }
  const timestamp = new Date(observedAt).getTime()
  if (!Number.isFinite(timestamp)) return { state: 'unknown', observedAt, refreshedAt, source, message: 'Horodatage source invalide.' }
  const ageMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000))
  const state: FreshnessState = ageMinutes <= 2 ? 'live' : ageMinutes <= Math.max(10, staleAfterMinutes / 3) ? 'fresh' : ageMinutes <= staleAfterMinutes ? 'aging' : 'stale'
  const message = state === 'live' ? 'Données en direct.' : state === 'fresh' ? `Actualisé il y a ${ageMinutes} min.` : state === 'aging' ? `Données vieillissantes · ${ageMinutes} min.` : `Données périmées · ${ageMinutes} min.`
  return { state, observedAt, refreshedAt, ageMinutes, source, message }
}
