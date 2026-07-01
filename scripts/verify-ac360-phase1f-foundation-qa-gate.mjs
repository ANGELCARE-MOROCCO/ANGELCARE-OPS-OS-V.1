import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  'supabase/migrations/20260630_ac360_phase1f_foundation_qa_deployment_gate.sql',
  'lib/ac360/phase1f-quality-gate.ts',
  'app/(protected)/angelcare-360/deployment-gate/page.tsx',
  'app/api/ac360/qa/run/route.ts',
  'app/api/ac360/qa/dashboard/route.ts',
  'app/api/ac360/deployment-gate/evaluate/route.ts',
  'app/api/ac360/deployment-gate/decision/route.ts',
  'app/api/ac360/readiness-matrix/route.ts',
]

const requiredSqlTokens = [
  'ac360_foundation_qa_runs',
  'ac360_foundation_qa_results',
  'ac360_foundation_gate_matrix',
  'ac360_engine_coverage_matrix',
  'ac360_deployment_gates',
  'ac360_deployment_gate_events',
  'ac360_run_foundation_qa',
  'ac360_evaluate_deployment_gate',
  'ac360_decide_deployment_gate',
  'ac360_foundation_readiness_dashboard',
  'qa.foundation_run',
  'deployment_gate.evaluate',
  'deployment_gate.decide',
  'readiness_matrix.view',
]

const requiredWiringTokens = [
  "'ac360.qa.run'",
  "'ac360.deployment_gate.evaluate'",
  "'ac360.deployment_gate.decide'",
  "'ac360.readiness_matrix.view'",
]

let ok = true
for (const file of requiredFiles) {
  if (!existsSync(file)) {
    console.error(`Missing required file: ${file}`)
    ok = false
  }
}

const sqlPath = 'supabase/migrations/20260630_ac360_phase1f_foundation_qa_deployment_gate.sql'
const sql = existsSync(sqlPath) ? readFileSync(sqlPath, 'utf8') : ''
for (const token of requiredSqlTokens) {
  if (!sql.includes(token)) {
    console.error(`Missing SQL token: ${token}`)
    ok = false
  }
}

const wiring = existsSync('lib/ac360/action-wiring.ts') ? readFileSync('lib/ac360/action-wiring.ts', 'utf8') : ''
for (const token of requiredWiringTokens) {
  if (!wiring.includes(token)) {
    console.error(`Missing wiring token: ${token}`)
    ok = false
  }
}

const constants = existsSync('lib/ac360/constants.ts') ? readFileSync('lib/ac360/constants.ts', 'utf8') : ''
for (const token of ['ac360_foundation_qa_runs','ac360_deployment_gates','AC360_FULL_ENGINE_COUNT = 52']) {
  if (!constants.includes(token)) {
    console.error(`Missing constants token: ${token}`)
    ok = false
  }
}

const page = existsSync('app/(protected)/angelcare-360/deployment-gate/page.tsx') ? readFileSync('app/(protected)/angelcare-360/deployment-gate/page.tsx', 'utf8') : ''
if (page.includes('background: \'#020617\'') || page.includes('background="#020617"')) {
  console.error('Dark UI detected in Phase 1F deployment gate page.')
  ok = false
}

if (!ok) process.exit(1)
console.log('✅ AC360 Phase 1F foundation QA/deployment gate verification passed.')
