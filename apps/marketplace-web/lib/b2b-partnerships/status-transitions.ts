import type { B2BCrmStatus } from './types'

const TERMINAL_STATUSES: B2BCrmStatus[] = ['Lost', 'Not Fit']
const SUCCESS_STATUSES: B2BCrmStatus[] = ['Pilot Agreed', 'Signed Partner']

export function requiresStatusReason(status: B2BCrmStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

export function isSuccessStatus(status: B2BCrmStatus): boolean {
  return SUCCESS_STATUSES.includes(status)
}

export function getStatusChangeActivityTitle(from: B2BCrmStatus, to: B2BCrmStatus): string {
  return `Prospect status changed from ${from} to ${to}`
}

export function validateStatusTransitionInput(params: {
  from: B2BCrmStatus
  to: B2BCrmStatus
  reason?: string | null
}): { ok: true } | { ok: false; error: string } {
  if (params.from === params.to) return { ok: false, error: 'Prospect is already in this status.' }

  if (requiresStatusReason(params.to) && !params.reason?.trim()) {
    return { ok: false, error: `A reason is required when moving a prospect to ${params.to}.` }
  }

  return { ok: true }
}
