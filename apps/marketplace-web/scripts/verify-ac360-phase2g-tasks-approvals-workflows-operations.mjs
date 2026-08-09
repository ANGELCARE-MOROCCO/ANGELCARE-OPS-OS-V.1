import fs from 'fs'
import path from 'path'

const root = process.cwd()
const required = [
  'supabase/migrations/20260630_ac360_phase2g_tasks_approvals_workflows_operations.sql',
  'lib/ac360/school-workflows.ts',
  'app/api/ac360/school-workflows/dashboard/route.ts',
  'app/api/ac360/school-workflows/task-boards/upsert/route.ts',
  'app/api/ac360/school-workflows/tasks/status/route.ts',
  'app/api/ac360/school-workflows/tasks/comment/route.ts',
  'app/api/ac360/school-workflows/tasks/checklist/route.ts',
  'app/api/ac360/school-workflows/tasks/recurring-rules/create/route.ts',
  'app/api/ac360/school-workflows/tasks/recurring-rules/generate/route.ts',
  'app/api/ac360/school-workflows/approvals/policies/upsert/route.ts',
  'app/api/ac360/school-workflows/approvals/request/route.ts',
  'app/api/ac360/school-workflows/approvals/decide/route.ts',
  'app/api/ac360/school-workflows/workflows/templates/upsert/route.ts',
  'app/api/ac360/school-workflows/workflows/start/route.ts',
  'app/api/ac360/school-workflows/workflows/advance-step/route.ts',
  'app/api/ac360/school-workflows/workflows/events/record/route.ts',
  'app/api/ac360/school-workflows/operations/tickets/open/route.ts',
  'app/api/ac360/school-workflows/operations/tickets/resolve/route.ts',
  'app/api/ac360/school-workflows/operations/reconcile/route.ts',
  'app/api/ac360/school-workflows/operations/alerts/resolve/route.ts',
]
const missing = required.filter((f) => !fs.existsSync(path.join(root, f)))
if (missing.length) {
  console.error('Missing Phase 2G files:', missing)
  process.exit(1)
}
const sql = fs.readFileSync(path.join(root, required[0]), 'utf8')
const requiredSql = [
  'ac360_school_task_boards',
  'ac360_school_task_status_transitions',
  'ac360_school_task_comments',
  'ac360_school_task_checklist_items',
  'ac360_school_recurring_task_rules',
  'ac360_school_approval_policies',
  'ac360_school_approval_requests',
  'ac360_school_approval_decisions',
  'ac360_school_workflow_templates',
  'ac360_school_workflow_instances',
  'ac360_school_workflow_steps',
  'ac360_school_workflow_events',
  'ac360_school_operations_tickets',
  'ac360_school_operations_snapshots',
  'ac360_school_operations_alerts',
  'ac360_school_workflows_dashboard',
  'ac360_school_upsert_task_board',
  'ac360_school_update_task_status',
  'ac360_school_request_approval',
  'ac360_school_decide_approval',
  'ac360_school_start_workflow_instance',
  'ac360_school_reconcile_operations',
  'school.task.board.upsert',
  'school.approval.request',
  'school.workflow.instance.start',
  'school.operations.reconcile',
  'uiBuildAllowed',
  'phase_2g_tasks_approvals_workflows_operations',
]
const missingSql = requiredSql.filter((needle) => !sql.includes(needle))
if (missingSql.length) {
  console.error('Phase 2G migration is missing required markers:', missingSql)
  process.exit(1)
}
const actionWiring = fs.readFileSync(path.join(root, 'lib/ac360/action-wiring.ts'), 'utf8')
for (const key of [
  'ac360.school_workflows.task_board.upsert',
  'ac360.school_workflows.approval.request',
  'ac360.school_workflows.instance.start',
  'ac360.school_workflows.operations.reconcile',
]) {
  if (!actionWiring.includes(key)) {
    console.error('Missing Phase 2G static action wiring key:', key)
    process.exit(1)
  }
}
const forbiddenUi = [
  'app/(protected)/angelcare-360/school-workflows/page.tsx',
  'app/angelcare-360/school-workflows/page.tsx',
  'app/(protected)/angelcare-360/tasks/page.tsx',
]
const createdUi = forbiddenUi.filter((f) => fs.existsSync(path.join(root, f)))
if (createdUi.length) {
  console.error('UI build lock violated. Phase 2G must not create school workflow UI pages:', createdUi)
  process.exit(1)
}
console.log('✅ AC360 Phase 2G tasks, approvals, workflows & operations runtime verification passed.')
console.log('✅ UI build remains locked: no school workflow/tasks page.tsx created.')
