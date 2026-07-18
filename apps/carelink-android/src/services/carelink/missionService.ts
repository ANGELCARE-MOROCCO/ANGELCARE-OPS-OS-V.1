import {requestJson} from '../api/httpClient'

export type MissionActionKey = 'accept' | 'decline' | 'start' | 'en-route' | 'arrive' | 'arrived' | 'delay' | 'incident' | 'request-replacement' | 'brief-acknowledge' | 'confirm-readiness' | 'complete'

export async function fetchMissions() { return requestJson('/api/carelink/missions', {method: 'GET'}) }
export async function fetchMission(id: string | number) { return requestJson(`/api/carelink/missions/${encodeURIComponent(String(id))}`, {method: 'GET'}) }
export async function performMissionAction(id: string | number, action: MissionActionKey, body: Record<string, unknown> = {}) {
  return requestJson(`/api/carelink/missions/${encodeURIComponent(String(id))}/${action}`, {method: 'POST', body: {source: 'angelcare_carelink_android_native', action, clientTimestamp: new Date().toISOString(), ...body}})
}
export async function submitMissionReport(id: string | number, body: Record<string, unknown>) {
  return requestJson(`/api/carelink/missions/${encodeURIComponent(String(id))}/report`, {method: 'POST', body: {source: 'angelcare_carelink_android_native', clientTimestamp: new Date().toISOString(), ...body}})
}
