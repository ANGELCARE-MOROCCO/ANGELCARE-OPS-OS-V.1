import {requestJson} from '../api/httpClient'

export async function submitSos(body: Record<string, unknown>) {
  return requestJson('/api/carelink/sos', {method: 'POST', body})
}
