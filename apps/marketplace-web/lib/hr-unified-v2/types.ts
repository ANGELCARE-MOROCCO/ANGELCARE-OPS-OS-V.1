export type HrStatus = 'active' | 'inactive' | 'draft' | 'open' | 'closed' | 'pending' | 'approved' | 'rejected' | 'completed' | 'blocked'

export type HrKpi = {
  label: string
  value: string | number
  detail?: string
  icon?: string
  tone?: string
}

export const HR_TASK_TYPES = [
  'opening_request',
  'candidate_screening',
  'interview_scheduling',
  'reference_check',
  'offer_preparation',
  'onboarding_checklist',
  'contract_document',
  'attendance_correction',
  'roster_adjustment',
  'performance_followup',
  'training_assignment',
  'disciplinary_followup',
] as const

export const RECRUITMENT_STAGES = ['applied','screening','interview','trial_shift','offer','hired','rejected'] as const
export const ONBOARDING_STEPS = ['identity','documents','contract','training','tools','first_shift','manager_validation'] as const
export const STAFF_PROFILE_TABS = ['overview','documents','attendance','roster','performance','training','incidents','tasks'] as const
