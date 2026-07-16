import {requestJson} from '../api/httpClient'

export async function fetchMessages() {
  return requestJson('/api/carelink/messages', {method: 'GET'})
}

export async function markMessageRead(id: string | number) {
  return requestJson(`/api/carelink/messages/${id}/read`, {method: 'POST'})
}
