import {requestJson} from '../api/httpClient'

export async function fetchSchedule() {
  return requestJson('/api/carelink/schedule', {method: 'GET'})
}

export async function saveAvailability(body: Record<string, unknown>) {
  return requestJson('/api/carelink/availability', {method: 'POST', body})
}
