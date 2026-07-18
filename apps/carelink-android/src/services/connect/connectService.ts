import {requestJson} from '../api/httpClient'
export async function fetchConnectRooms() { return requestJson('/api/connect/rooms', {method: 'GET'}) }
export async function fetchConnectConversations() { return requestJson('/api/connect/conversations', {method: 'GET'}) }
export async function fetchConnectMessages() { return requestJson('/api/connect/messages', {method: 'GET'}) }
export async function sendConnectMessage(body: Record<string, unknown>) { return requestJson('/api/connect/messages', {method: 'POST', body}) }
export async function fetchConnectCallLog() { return requestJson('/api/connect/call-log', {method: 'GET'}) }
export async function requestLiveKitToken(body: Record<string, unknown>) { return requestJson('/api/connect/livekit-token', {method: 'POST', body}) }
