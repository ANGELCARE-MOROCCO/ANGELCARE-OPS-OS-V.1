import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { projectRoot, writeEvidence, markdownTable } from './lib.mjs'

const root = projectRoot()
const connection = process.env.MARKETPLACE_DATABASE_URL || process.env.DATABASE_URL
if (!connection) {
  console.error('FAIL: MARKETPLACE_DATABASE_URL or DATABASE_URL is required for the read-only database preflight.')
  process.exit(1)
}
const sql = path.join(root, 'scripts/angelcare-marketplace/final-stabilization/database-preflight.sql')
if (!fs.existsSync(sql)) {
  console.error(`FAIL: Preflight SQL missing: ${sql}`)
  process.exit(1)
}
const result = spawnSync('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-tA', connection, '-f', sql], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
})
if (result.error) {
  console.error(`FAIL: psql could not start: ${result.error.message}`)
  process.exit(1)
}
if (result.status !== 0) {
  console.error(result.stdout)
  console.error(result.stderr)
  process.exit(result.status || 1)
}
const line = result.stdout.split(/\r?\n/).map((entry) => entry.trim()).find((entry) => entry.startsWith('{') && entry.endsWith('}'))
if (!line) {
  console.error('FAIL: Database preflight did not return its JSON evidence row.')
  console.error(result.stdout)
  process.exit(1)
}
const payload = JSON.parse(line)
const evidence = {
  programme: 'ANGELCARE Marketplace Selected Database Preflight',
  status: String(payload.status || 'FAIL').toUpperCase(),
  completedAt: new Date().toISOString(),
  database: payload,
  readOnly: true,
}
const relationRows = (payload.required_relations || []).map((entry) => [entry.name, entry.present ? 'PASS' : 'FAIL'])
const permissionRows = (payload.required_permissions || []).map((entry) => [entry.key, entry.present ? 'PASS' : 'FAIL'])
const markdown = `# ANGELCARE Marketplace Selected Database Preflight

**Status:** ${evidence.status}
**Read-only transaction:** YES
**Checked at:** ${payload.checked_at || evidence.completedAt}

## Required relations

${markdownTable(['Relation', 'Result'], relationRows)}

## Required permissions

${markdownTable(['Permission', 'Result'], permissionRows)}

## Table security

${markdownTable(['Measure', 'Value'], Object.entries(payload.table_security || {}))}

## Launch truth

- Production launch claimed in database: **${payload.production_launch_claimed ? 'YES' : 'NO'}**
- Launch gates: \`${JSON.stringify(payload.launch_gates || {})}\`
- Releases: \`${JSON.stringify(payload.releases || {})}\`
`
const paths = writeEvidence('DATABASE_PREFLIGHT', evidence, markdown)
console.log(`ANGELCARE Marketplace database preflight: ${evidence.status}`)
console.log(`Evidence: ${paths.latestMarkdown}`)
process.exitCode = evidence.status === 'PASS' ? 0 : 1
