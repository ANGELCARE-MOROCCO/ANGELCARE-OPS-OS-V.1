import {requestJson} from '../api/httpClient'
export async function fetchNotifications() { return requestJson('/api/carelink/notifications', {method: 'GET'}) }
export async function acknowledgeNotification(id: string | number) { return requestJson(`/api/carelink/notifications/${encodeURIComponent(String(id))}/acknowledge`, {method: 'POST'}) }
export async function fetchAlerts() { return requestJson('/api/carelink/alerts', {method: 'GET'}) }
export async function acknowledgeAlert(id: string | number) { return requestJson(`/api/carelink/alerts/${encodeURIComponent(String(id))}/acknowledge`, {method: 'POST'}) }
