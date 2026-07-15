import fs from 'fs'
import path from 'path'

const root = process.cwd()
const required = [
  'supabase/migrations/20260630_ac360_phase2n_ai_automation_smart_alerts_scheduled_jobs.sql',
  'lib/ac360/school-automation.ts',
  'lib/ac360/action-wiring.ts',
  'app/api/ac360/school-automation/dashboard/route.ts',
  'app/api/ac360/school-automation/ai-prompts/upsert/route.ts',
  'app/api/ac360/school-automation/ai-jobs/queue/route.ts',
  'app/api/ac360/school-automation/ai-jobs/complete/route.ts',
  'app/api/ac360/school-automation/automation-rules/upsert/route.ts',
  'app/api/ac360/school-automation/automation-runs/trigger/route.ts',
  'app/api/ac360/school-automation/scheduled-jobs/upsert/route.ts',
  'app/api/ac360/school-automation/scheduled-jobs/run/route.ts',
  'app/api/ac360/school-automation/smart-alert-rules/upsert/route.ts',
  'app/api/ac360/school-automation/smart-alerts/emit/route.ts',
  'app/api/ac360/school-automation/smart-alerts/resolve/route.ts',
  'app/api/ac360/school-automation/reconcile/route.ts',
  'app/api/ac360/school-automation/alerts/resolve/route.ts'
]

const missing = required.filter((rel) => !fs.existsSync(path.join(root, rel)))
if (missing.length) {
  console.error('Missing Phase 2N files:', missing)
  process.exit(1)
}

const sql = fs.readFileSync(path.join(root, required[0]), 'utf8')
const mustContain = [
  'ac360_school_ai_prompt_templates',
  'ac360_school_ai_jobs',
  'ac360_school_automation_blueprints',
  'ac360_school_automation_rules',
  'ac360_school_automation_runs',
  'ac360_school_scheduled_jobs',
  'ac360_school_smart_alert_rules',
  'ac360_school_smart_alerts',
  'ac360_school_ai_automation_snapshots',
  'ac360_school_ai_automation_dashboard',
  'ac360_school_ai_automation_reconcile',
  'school.ai.job.queue',
  'school.automation.run.trigger',
  'school.scheduled_job.run',
  'school.smart_alert.emit',
  'uiBuildAllowed":false'
]
const absent = mustContain.filter((item) => !sql.includes(item))
if (absent.length) {
  console.error('Phase 2N SQL missing expected fragments:', absent)
  process.exit(1)
}

const aw = fs.readFileSync(path.join(root, 'lib/ac360/action-wiring.ts'), 'utf8')
for (const key of ['ac360.school_automation.ai_job.queue','ac360.school_automation.reconcile','ac360.school_parenttrust.reconcile','ac360.school_academy.reconcile']) {
  if (!aw.includes(key)) {
    console.error('Static action wiring missing key:', key)
    process.exit(1)
  }
}

const forbiddenUiHints = [
  'app/(protected)/angelcare-360/school-automation/page.tsx',
  'app/(protected)/angelcare-360/automation/page.tsx',
  'app/(protected)/angelcare-360/ai/page.tsx'
]
for (const rel of forbiddenUiHints) {
  if (fs.existsSync(path.join(root, rel))) {
    console.error('UI build lock violated:', rel)
    process.exit(1)
  }
}

console.log('✅ AC360 Phase 2N AI, automation, smart alerts & scheduled jobs runtime verification passed.')
console.log('✅ UI build remains locked: no AI/automation/front-end page.tsx created.')
