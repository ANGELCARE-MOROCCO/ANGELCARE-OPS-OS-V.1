export type HrStatus = 'active' | 'on_leave' | 'probation' | 'inactive' | 'suspended'
export type HrPriority = 'low' | 'medium' | 'high' | 'critical'
export type HrWorkflowStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'completed' | 'paused'

export type HrEmployee = {
  id: string
  fullName: string
  role: string
  department: string
  location: string
  status: HrStatus
  score: number
  attendanceRate: number
  payrollStatus: 'ready' | 'blocked' | 'review' | 'paid'
  contractType: 'CDI' | 'CDD' | 'Freelance' | 'Internship'
  startDate: string
  manager: string
  phone: string
  email: string
  tags: string[]
}

export type HrCandidate = {
  id: string
  fullName: string
  role: string
  stage: 'sourced' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'
  score: number
  owner: string
  priority: HrPriority
  nextAction: string
}

export type HrTask = {
  id: string
  title: string
  owner: string
  module: string
  status: HrWorkflowStatus
  priority: HrPriority
  dueDate: string
  impact: string
}

export type HrDocument = {
  id: string
  title: string
  owner: string
  type: 'contract' | 'policy' | 'certificate' | 'payroll' | 'identity' | 'training'
  status: HrWorkflowStatus
  expiryDate?: string
  risk: HrPriority
}

export type HrAuditLog = {
  id: string
  actor: string
  action: string
  target: string
  createdAt: string
  severity: HrPriority
}
