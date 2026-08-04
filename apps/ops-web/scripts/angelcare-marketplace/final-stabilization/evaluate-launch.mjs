import fs from 'node:fs'
import path from 'node:path'
import { evidenceDirectory, writeEvidence, markdownTable } from './lib.mjs'

const directory = evidenceDirectory()
const startedAt = new Date().toISOString()

function load(name) {
  const file = path.join(directory, `${name}_LATEST.json`)
  if (!fs.existsSync(file)) return { present: false, file, value: null }
  try { return { present: true, file, value: JSON.parse(fs.readFileSync(file, 'utf8')) } }
  catch (error) { return { present: true, file, value: null, error: error instanceof Error ? error.message : String(error) } }
}

const sources = {
  static: load('STATIC_ACCEPTANCE'),
  sqlSecurity: load('SQL_SECURITY_ASSURANCE'),
  routes: load('ROUTE_INVENTORY'),
  uiuxMatrix: load('UIUX_ACCEPTANCE_MATRIX'),
  typescript: load('TYPESCRIPT_AUTHORITY'),
  runtime: load('RUNTIME_SMOKE'),
  visual: load('VISUAL_ACCEPTANCE'),
  database: load('DATABASE_PREFLIGHT'),
  accessibility: load('ACCESSIBILITY_ACCEPTANCE'),
  performance: load('PERFORMANCE_ACCEPTANCE'),
  backupRestore: load('BACKUP_RESTORE_EVIDENCE'),
}

function sourceStatus(source) {
  if (!source.present) return 'MISSING'
  if (!source.value) return 'INVALID'
  return String(source.value.status || source.value.result || 'UNKNOWN').toUpperCase()
}

const gates = [
  ['Static cumulative authority', 'static', ['PASS']],
  ['SQL and source-security authority', 'sqlSecurity', ['PASS']],
  ['Route and navigation integrity', 'routes', ['PASS']],
  ['UI/UIX source matrix', 'uiuxMatrix', ['SOURCE_ACCEPTED_RUNTIME_PENDING', 'PASS']],
  ['Marketplace TypeScript authority', 'typescript', ['PASS']],
  ['Runtime route/API smoke', 'runtime', ['PASS']],
  ['Browser visual and responsive acceptance', 'visual', ['PASS']],
  ['Selected Supabase database preflight', 'database', ['PASS']],
  ['Accessibility acceptance', 'accessibility', ['PASS']],
  ['Performance acceptance', 'performance', ['PASS']],
  ['Backup and restore-test evidence', 'backupRestore', ['PASS']],
].map(([label, key, accepted]) => {
  const status = sourceStatus(sources[key])
  return { label, key, status, accepted: accepted.includes(status), evidence: sources[key].file }
})

const criticalDefectFile = path.join(directory, 'DEFECT_REGISTER.json')
let criticalDefects = []
if (fs.existsSync(criticalDefectFile)) {
  try {
    const value = JSON.parse(fs.readFileSync(criticalDefectFile, 'utf8'))
    criticalDefects = (value.defects || []).filter((defect) => defect.severity === 'critical' && !['verified', 'closed'].includes(defect.status))
  } catch {}
}

const requiredMissing = gates.filter((gate) => !gate.accepted)
let decision = 'BLOCKED'
let rationale = 'Required environmental evidence is incomplete.'
if (requiredMissing.length === 0 && criticalDefects.length === 0) {
  decision = 'CONDITIONAL_APPROVAL'
  rationale = 'All technical evidence gates pass. Executive separation-of-duties approval and separately authorized deployment remain required.'
}
if (criticalDefects.length) rationale = `${criticalDefects.length} unresolved critical defect(s) block launch.`

const evidence = {
  programme: 'ANGELCARE Marketplace Final Launch Decision',
  startedAt,
  completedAt: new Date().toISOString(),
  status: decision,
  rationale,
  gates,
  criticalDefects,
  productionLaunchExecuted: false,
  executiveApprovalRecorded: false,
}
const markdown = `# ANGELCARE Marketplace Final Launch Decision

## Decision: ${decision}

${rationale}

${markdownTable(['Gate', 'Evidence status', 'Accepted'], gates.map((gate) => [gate.label, gate.status, gate.accepted ? 'YES' : 'NO']))}

**Unresolved critical defects:** ${criticalDefects.length}
**Production launch executed:** NO
**Executive approval recorded:** NO

## Authority boundary

This evaluator never deploys and never manufactures readiness. Even a fully passing technical evidence set produces only conditional approval until executive separation-of-duties approval is recorded and deployment is separately authorized.
`
const paths = writeEvidence('FINAL_LAUNCH_DECISION', evidence, markdown)
console.log(`ANGELCARE Marketplace final launch decision: ${decision}`)
console.log(`Evidence: ${paths.latestMarkdown}`)
process.exitCode = decision === 'BLOCKED' ? 2 : 0
