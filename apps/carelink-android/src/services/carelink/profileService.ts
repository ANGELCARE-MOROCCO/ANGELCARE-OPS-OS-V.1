import {requestJson} from '../api/httpClient'
export async function fetchProfile() { return requestJson('/api/carelink/profile', {method: 'GET'}) }
export async function submitProfileCorrection(body: Record<string, unknown>) { return requestJson('/api/carelink/profile/corrections', {method: 'POST', body}) }
export async function submitProfileDocuments(body: Record<string, unknown>) { return requestJson('/api/carelink/profile/documents', {method: 'POST', body}) }
export async function fetchReadiness() { return requestJson('/api/carelink/readiness', {method: 'GET'}) }
export async function requestReadinessReview(body: Record<string, unknown> = {}) { return requestJson('/api/carelink/readiness/review-request', {method: 'POST', body}) }
