import {requestJson} from '../api/httpClient'

export async function fetchPayments() {
  return requestJson('/api/carelink/payments', {method: 'GET'})
}

export async function submitPaymentDispute(body: Record<string, unknown>) {
  return requestJson('/api/carelink/payments/disputes', {method: 'POST', body})
}
