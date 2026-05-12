export const HR_WORKFLOWS = [
  { key: 'candidate_to_staff', label: 'Candidate to Staff', steps: ['candidate_approved','contract_created','documents_checked','profile_created','onboarding_started'] },
  { key: 'attendance_to_payroll', label: 'Attendance to Payroll', steps: ['punch_events_synced','exceptions_reviewed','manager_approval','payroll_input_generated'] },
  { key: 'leave_request', label: 'Leave Request', steps: ['request_submitted','hr_review','manager_decision','attendance_calendar_updated'] },
  { key: 'contract_expiry', label: 'Contract Expiry', steps: ['expiry_detected','renewal_task_created','approval','document_signed'] },
]
export function getHRWorkflow(key: string){ return HR_WORKFLOWS.find(x => x.key === key) }
