import type { ApprovalClass, StudioStatus } from '../strategy-studio/types'

export type ApprovalDeskAction = 'approve' | 'request_correction' | 'reject'

export interface ApprovalDeskItem {
  strategyId: string
  strategyVersion: string
  requestId?: string
  code: string
  title: string
  category: string
  status: StudioStatus
  approvalClass: ApprovalClass
  impact: string
  deadline: string
  risk: string
  completeness: number
  whyNow: string
  authorizedScope: string
  alternative: string
  exitCondition: string
  conditionsText: string
  traceId: string
  canDecide: boolean
  externalActions: 0
}

export interface ApprovalDeskResponse {
  ok: true
  data: ApprovalDeskItem[]
  warnings: string[]
  mode: 'live-shadow'
  externalActions: 0
}
