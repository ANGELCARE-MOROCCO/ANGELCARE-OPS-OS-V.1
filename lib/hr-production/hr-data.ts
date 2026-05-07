import type { HrAuditLog, HrCandidate, HrDocument, HrEmployee, HrTask } from '@/types/hr-production'

export const hrEmployees: HrEmployee[] = [
  { id: 'emp-001', fullName: 'Amina Benali', role: 'Care Operations Lead', department: 'Operations', location: 'Rabat', status: 'active', score: 94, attendanceRate: 98, payrollStatus: 'ready', contractType: 'CDI', startDate: '2024-02-01', manager: 'Executive Office', phone: '+212600000001', email: 'amina@angelcare.local', tags: ['leadership','care-quality','priority'] },
  { id: 'emp-002', fullName: 'Youssef El Idrissi', role: 'Field Care Coordinator', department: 'Field Care', location: 'Casablanca', status: 'probation', score: 81, attendanceRate: 91, payrollStatus: 'review', contractType: 'CDD', startDate: '2025-10-15', manager: 'Amina Benali', phone: '+212600000002', email: 'youssef@angelcare.local', tags: ['field','probation'] },
  { id: 'emp-003', fullName: 'Sara Alaoui', role: 'HR Administration Officer', department: 'HR', location: 'Temara', status: 'active', score: 89, attendanceRate: 96, payrollStatus: 'ready', contractType: 'CDI', startDate: '2023-08-20', manager: 'Executive Office', phone: '+212600000003', email: 'sara@angelcare.local', tags: ['documents','payroll','compliance'] },
  { id: 'emp-004', fullName: 'Mehdi Ziani', role: 'Recruitment Specialist', department: 'HR', location: 'Rabat', status: 'on_leave', score: 77, attendanceRate: 86, payrollStatus: 'blocked', contractType: 'CDI', startDate: '2024-11-05', manager: 'Sara Alaoui', phone: '+212600000004', email: 'mehdi@angelcare.local', tags: ['recruitment','leave'] },
]

export const hrCandidates: HrCandidate[] = [
  { id: 'cand-001', fullName: 'Nadia Fassi', role: 'Senior Caregiver', stage: 'interview', score: 88, owner: 'Mehdi Ziani', priority: 'high', nextAction: 'Final validation and reference check' },
  { id: 'cand-002', fullName: 'Omar Tazi', role: 'Care Coordinator', stage: 'offer', score: 91, owner: 'Sara Alaoui', priority: 'critical', nextAction: 'Issue offer and contract pack' },
  { id: 'cand-003', fullName: 'Lina Haddad', role: 'HR Intern', stage: 'screening', score: 73, owner: 'Mehdi Ziani', priority: 'medium', nextAction: 'Phone screening' },
]

export const hrTasks: HrTask[] = [
  { id: 'task-001', title: 'Close May payroll blockers', owner: 'Sara Alaoui', module: 'Payroll', status: 'pending', priority: 'critical', dueDate: '2026-05-07', impact: 'Payroll release readiness' },
  { id: 'task-002', title: 'Validate caregiver onboarding batch', owner: 'Amina Benali', module: 'Recruitment', status: 'pending', priority: 'high', dueDate: '2026-05-09', impact: 'Staffing capacity' },
  { id: 'task-003', title: 'Audit expired documents', owner: 'Sara Alaoui', module: 'Documents', status: 'paused', priority: 'high', dueDate: '2026-05-10', impact: 'Compliance risk' },
  { id: 'task-004', title: 'Performance review calibration', owner: 'Executive Office', module: 'Performance', status: 'draft', priority: 'medium', dueDate: '2026-05-15', impact: 'Promotion and retention planning' },
]

export const hrDocuments: HrDocument[] = [
  { id: 'doc-001', title: 'Amina Benali - CDI Contract', owner: 'Amina Benali', type: 'contract', status: 'approved', expiryDate: '2028-02-01', risk: 'low' },
  { id: 'doc-002', title: 'Youssef El Idrissi - Probation Review', owner: 'Youssef El Idrissi', type: 'policy', status: 'pending', expiryDate: '2026-06-15', risk: 'medium' },
  { id: 'doc-003', title: 'Caregiver Safety Certification Batch', owner: 'Field Care Team', type: 'certificate', status: 'pending', expiryDate: '2026-05-30', risk: 'critical' },
]

export const hrAuditLogs: HrAuditLog[] = [
  { id: 'log-001', actor: 'HR Command', action: 'Payroll readiness scan completed', target: 'Payroll', createdAt: '2026-05-05T08:30:00Z', severity: 'high' },
  { id: 'log-002', actor: 'HR Command', action: '3 candidate actions generated', target: 'Recruitment', createdAt: '2026-05-05T09:10:00Z', severity: 'medium' },
  { id: 'log-003', actor: 'HR Command', action: 'Critical document expiry detected', target: 'Documents', createdAt: '2026-05-05T10:45:00Z', severity: 'critical' },
]

export function getHrSnapshot() {
  const active = hrEmployees.filter(e => e.status === 'active').length
  const blockers = hrEmployees.filter(e => e.payrollStatus === 'blocked').length + hrDocuments.filter(d => d.risk === 'critical').length
  const avgScore = Math.round(hrEmployees.reduce((s,e)=>s+e.score,0)/Math.max(hrEmployees.length,1))
  const attendance = Math.round(hrEmployees.reduce((s,e)=>s+e.attendanceRate,0)/Math.max(hrEmployees.length,1))
  return { active, blockers, avgScore, attendance, employees: hrEmployees.length, candidates: hrCandidates.length, tasks: hrTasks.length, documents: hrDocuments.length }
}
