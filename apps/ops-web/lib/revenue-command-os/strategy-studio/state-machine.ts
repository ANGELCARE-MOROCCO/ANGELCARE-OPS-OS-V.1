import type { StudioAction, StudioStatus } from './types'

const transitions:Record<StudioStatus,Partial<Record<StudioAction,StudioStatus>>>= {
  awaiting_executive_review:{approve:'approved',reject:'rejected',amend:'amendment_requested',combine:'reanalysis_requested',request_reanalysis:'reanalysis_requested',request_evidence:'evidence_requested',change_objective:'reanalysis_requested',change_constraint:'reanalysis_requested',change_approval_class:'under_review',archive:'archived',export_memo:'awaiting_executive_review'},
  under_review:{approve:'approved',reject:'rejected',amend:'amendment_requested',combine:'reanalysis_requested',request_reanalysis:'reanalysis_requested',request_evidence:'evidence_requested',change_objective:'reanalysis_requested',change_constraint:'reanalysis_requested',change_approval_class:'under_review',archive:'archived',export_memo:'under_review'},
  evidence_requested:{request_evidence:'evidence_requested',request_reanalysis:'reanalysis_requested',archive:'archived',reopen:'reopened',export_memo:'evidence_requested'},
  reanalysis_requested:{request_reanalysis:'reanalysis_requested',archive:'archived',reopen:'reopened',export_memo:'reanalysis_requested'},
  amendment_requested:{amend:'amendment_requested',archive:'archived',reopen:'reopened',export_memo:'amendment_requested'},
  conditional_approval:{approve:'approved',reject:'rejected',amend:'amendment_requested',request_evidence:'evidence_requested',archive:'archived',export_memo:'conditional_approval'},
  approved:{archive:'archived',reopen:'reopened',export_memo:'approved'},
  rejected:{reopen:'reopened',archive:'archived',export_memo:'rejected'},
  archived:{reopen:'reopened',export_memo:'archived'},
  reopened:{approve:'approved',reject:'rejected',amend:'amendment_requested',combine:'reanalysis_requested',request_reanalysis:'reanalysis_requested',request_evidence:'evidence_requested',change_objective:'reanalysis_requested',change_constraint:'reanalysis_requested',change_approval_class:'under_review',archive:'archived',export_memo:'reopened'},
  approval_expired:{reopen:'reopened',archive:'archived',export_memo:'approval_expired'},
  approval_revoked:{reopen:'reopened',archive:'archived',export_memo:'approval_revoked'},
  superseded:{archive:'archived',export_memo:'superseded'},
  ready_for_mz13:{archive:'archived',export_memo:'ready_for_mz13'},
}
export function nextStudioStatus(current:StudioStatus,action:StudioAction,conditional=false):StudioStatus{
  if(action==='approve'&&conditional)return'conditional_approval'
  const next=transitions[current]?.[action]
  if(!next)throw new Error(`STUDIO_TRANSITION_NOT_ALLOWED:${current}:${action}`)
  return next
}
