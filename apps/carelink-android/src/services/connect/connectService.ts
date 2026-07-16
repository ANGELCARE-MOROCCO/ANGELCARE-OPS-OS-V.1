import {requestJson} from '../api/httpClient'

export async function fetchConnectRooms() {
  return requestJson('/api/connect/rooms', {method: 'GET'})
}

export async function fetchConnectConversations() {
  return requestJson('/api/connect/conversations', {method: 'GET'})
}

export async function fetchConnectMessages() {
  return requestJson('/api/connect/messages', {method: 'GET'})
}

export async function fetchConnectCallLog() {
  return requestJson('/api/connect/call-log', {method: 'GET'})
}
