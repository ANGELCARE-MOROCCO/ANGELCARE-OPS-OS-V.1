'use client'

export type RevenueActionState =
  | 'queued'
  | 'validating'
  | 'running'
  | 'approval'
  | 'success'
  | 'partial'
  | 'failure'
  | 'cancelled'

export type RevenueActionProgress = {
  id: string
  title: string
  workspace: string
  state: RevenueActionState
  step: string
  progress?: number
  indeterminate?: boolean
  startedAt: string
  updatedAt: string
  completedAt?: string
  detail?: string
  warningCount?: number
  completedItems?: number
  totalItems?: number
  resultHref?: string
  auditHref?: string
  reportName?: string
  error?: string
  dismissible?: boolean
}

export const REVENUE_ACTION_EVENT = 'revenue-os:action-progress'

export function emitRevenueAction(
  input: Omit<RevenueActionProgress, 'startedAt' | 'updatedAt'> & Partial<Pick<RevenueActionProgress, 'startedAt' | 'updatedAt'>>,
) {
  if (typeof window === 'undefined') return
  const now = new Date().toISOString()
  const detail: RevenueActionProgress = {
    ...input,
    startedAt: input.startedAt || now,
    updatedAt: input.updatedAt || now,
  }
  window.dispatchEvent(new CustomEvent(REVENUE_ACTION_EVENT, { detail }))
}

export function revenueActionId(prefix = 'action') {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${random}`
}

export function managedRevenueHeaders(headers?: HeadersInit) {
  const next = new Headers(headers)
  next.set('x-revenue-progress-managed', '1')
  return next
}
