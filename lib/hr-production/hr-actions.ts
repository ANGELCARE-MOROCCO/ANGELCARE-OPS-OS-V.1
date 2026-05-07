import { hrAuditLogs, hrCandidates, hrDocuments, hrEmployees, hrTasks } from './hr-data'
import type { HrPriority, HrWorkflowStatus } from '@/types/hr-production'

const stamp = () => new Date().toISOString()
const id = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`

export function createAudit(actor: string, action: string, target: string, severity: HrPriority = 'medium') {
  const log = { id: id('log'), actor, action, target, createdAt: stamp(), severity }
  hrAuditLogs.unshift(log)
  return log
}

export function executeHrAction(action: string, payload: Record<string, any> = {}) {
  switch (action) {
    case 'create_employee': {
      const employee = { id: id('emp'), fullName: payload.fullName || 'New HR Employee', role: payload.role || 'Care Staff', department: payload.department || 'Operations', location: payload.location || 'Rabat', status: 'active' as const, score: 80, attendanceRate: 100, payrollStatus: 'review' as const, contractType: 'CDD' as const, startDate: stamp().slice(0,10), manager: payload.manager || 'HR Command', phone: payload.phone || '', email: payload.email || '', tags: ['new','needs-validation'] }
      hrEmployees.unshift(employee)
      createAudit('HR Command', 'Employee created', employee.fullName, 'high')
      return { ok: true, employee }
    }
    case 'advance_candidate': {
      const candidate = hrCandidates.find(c => c.id === payload.id)
      if (!candidate) return { ok: false, error: 'Candidate not found' }
      const order = ['sourced','screening','interview','offer','hired'] as const
      const current = order.indexOf(candidate.stage as any)
      candidate.stage = order[Math.min(current + 1, order.length - 1)]
      candidate.nextAction = candidate.stage === 'hired' ? 'Create employee record and onboarding checklist' : 'Continue pipeline execution'
      createAudit('Recruitment', 'Candidate advanced', candidate.fullName, 'medium')
      return { ok: true, candidate }
    }
    case 'update_task_status': {
      const task = hrTasks.find(t => t.id === payload.id)
      if (!task) return { ok: false, error: 'Task not found' }
      task.status = (payload.status || 'completed') as HrWorkflowStatus
      createAudit('Task Execution', `Task marked ${task.status}`, task.title, task.priority)
      return { ok: true, task }
    }
    case 'approve_document': {
      const doc = hrDocuments.find(d => d.id === payload.id)
      if (!doc) return { ok: false, error: 'Document not found' }
      doc.status = 'approved'
      doc.risk = 'low'
      createAudit('Documents', 'Document approved', doc.title, 'medium')
      return { ok: true, document: doc }
    }
    case 'run_payroll_scan': {
      const blocked = hrEmployees.filter(e => e.payrollStatus === 'blocked' || e.payrollStatus === 'review')
      createAudit('Payroll', `${blocked.length} payroll blockers scanned`, 'Payroll Control', blocked.length ? 'critical' : 'low')
      return { ok: true, blockers: blocked }
    }
    case 'generate_daily_plan': {
      const plan = [
        'Clear critical document expiries',
        'Close payroll blockers before finance approval',
        'Advance offer-stage candidates',
        'Review attendance anomalies',
        'Assign owners to pending HR tasks',
      ]
      createAudit('HR Command', 'Daily execution plan generated', 'Command Dashboard', 'high')
      return { ok: true, plan }
    }
    default:
      createAudit('HR Command', `Action executed: ${action}`, payload.target || 'HR System', 'medium')
      return { ok: true, action, payload }
  }
}
