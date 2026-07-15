#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase1d_real_app_action_wiring.sql',
  'lib/ac360/action-wiring.ts',
  'app/api/ac360/action-wiring/route.ts',
  'app/api/ac360/action-wiring/preflight/route.ts',
  'app/(protected)/angelcare-360/action-wiring/page.tsx',
]
const patchedFiles = [
  'lib/ac360/guard.ts',
  'app/api/ac360/addons/route.ts',
  'app/api/ac360/credits/topup/route.ts',
  'app/api/ac360/invoices/generate/route.ts',
  'app/api/ac360/lifecycle/reconcile/route.ts',
  'app/api/ac360/capacity/snapshot/route.ts',
  'app/api/email-os/compose/send/route.ts',
  'app/api/email-os/compose/attachments/route.ts',
  'app/api/email-os/ai-assist/route.ts',
  'app/api/capital-command-center/tasks/route.ts',
  'app/api/capital-command-center/tasks/import/route.ts',
  'app/api/tasks/route.ts',
]

function read(file) {
  const full = path.join(root, file)
  if (!fs.existsSync(full)) throw new Error(`Missing file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

for (const file of requiredFiles) read(file)
for (const file of patchedFiles) {
  const text = read(file)
  if (!text.includes('runAc360WiredAction') && file !== 'lib/ac360/guard.ts') {
    throw new Error(`File is not wired with runAc360WiredAction: ${file}`)
  }
}

const sql = read('supabase/migrations/20260630_ac360_phase1d_real_app_action_wiring.sql')
for (const needle of [
  'ac360_app_action_wiring',
  'communication.email_send',
  'operations.task_create',
  'operations.task_import',
  'phase1d.wiring.strict_before_executor',
  '/api/email-os/compose/send',
  '/api/ac360/addons',
]) {
  if (!sql.includes(needle)) throw new Error(`Migration missing ${needle}`)
}

const wiring = read('lib/ac360/action-wiring.ts')
for (const key of ['ac360.addon.activate','email_os.compose_send','capital.tasks.import','revenue.tasks.update']) {
  if (!wiring.includes(key)) throw new Error(`action-wiring missing ${key}`)
}

const guard = read('lib/ac360/guard.ts')
if (!guard.includes(':preflight') || !guard.includes(':usage')) {
  throw new Error('guard.ts must separate preflight and usage idempotency keys')
}

console.log('✅ AC360 Phase 1D real app action wiring verification passed.')
