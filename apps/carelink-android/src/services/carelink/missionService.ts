import {requestJson} from '../api/httpClient'

export async function fetchMissions() {
  return requestJson('/api/carelink/missions', {method: 'GET'})
}

export async function fetchMission(id: string | number) {
  return requestJson(`/api/carelink/missions/${id}`, {method: 'GET'})
}
