import {requestJson} from '../api/httpClient'

export async function fetchNotifications() {
  return requestJson('/api/carelink/notifications', {method: 'GET'})
}

export async function acknowledgeNotification(id: string | number) {
  return requestJson(`/api/carelink/notifications/${id}/acknowledge`, {method: 'POST'})
}
