import fs from 'node:fs'
import path from 'node:path'
import { evidenceDirectory, writeEvidence, markdownTable, humanBytes } from './lib.mjs'

const directory = evidenceDirectory()
const visualFile = path.join(directory, 'VISUAL_ACCEPTANCE_LATEST.json')
if (!fs.existsSync(visualFile)) {
  console.error('FAIL: VISUAL_ACCEPTANCE_LATEST.json is required before performance evaluation.')
  process.exit(1)
}
const visual = JSON.parse(fs.readFileSync(visualFile, 'utf8'))
const budgets = {
  navigationMs: Number(process.env.MARKETPLACE_BUDGET_NAVIGATION_MS || 5000),
  transferBytes: Number(process.env.MARKETPLACE_BUDGET_TRANSFER_BYTES || 6 * 1024 * 1024),
  decodedBytes: Number(process.env.MARKETPLACE_BUDGET_DECODED_BYTES || 15 * 1024 * 1024),
  domNodes: Number(process.env.MARKETPLACE_BUDGET_DOM_NODES || 7000),
}
const rows = (visual.results || []).map((entry) => {
  const dom = entry.dom || {}
  const issues = []
  if (dom.navigationDuration != null && dom.navigationDuration > budgets.navigationMs) issues.push(`navigation ${Math.round(dom.navigationDuration)}ms`)
  if ((dom.transferBytes || 0) > budgets.transferBytes) issues.push(`transfer ${humanBytes(dom.transferBytes)}`)
  if ((dom.decodedBodyBytes || 0) > budgets.decodedBytes) issues.push(`decoded ${humanBytes(dom.decodedBodyBytes)}`)
  if ((dom.domNodes || 0) > budgets.domNodes) issues.push(`DOM ${dom.domNodes}`)
  return {
    route: entry.route,
    viewport: entry.viewport,
    navigationMs: dom.navigationDuration,
    transferBytes: dom.transferBytes || 0,
    decodedBytes: dom.decodedBodyBytes || 0,
    domNodes: dom.domNodes || 0,
    issues,
  }
})
const failures = rows.filter((row) => row.issues.length)
const missingProtected = !visual.storageStateSupplied || Number(visual.summary?.protectedRoutesCaptured || 0) === 0
const status = String(visual.status).toUpperCase() === 'PASS' && !missingProtected && failures.length === 0 ? 'PASS' : 'FAIL'
const evidence = {
  programme: 'ANGELCARE Marketplace Performance Acceptance',
  status,
  completedAt: new Date().toISOString(),
  budgets,
  summary: { captures: rows.length, failures: failures.length, protectedCaptured: !missingProtected },
  rows,
}
const markdown = `# ANGELCARE Marketplace Performance Acceptance

**Status:** ${status}
**Captures:** ${rows.length}
**Budget failures:** ${failures.length}
**Protected routes captured:** ${missingProtected ? 'NO' : 'YES'}

## Budgets

${markdownTable(['Budget', 'Threshold'], [
  ['Navigation duration', `${budgets.navigationMs} ms`],
  ['Transferred resources', humanBytes(budgets.transferBytes)],
  ['Decoded resource body', humanBytes(budgets.decodedBytes)],
  ['DOM nodes', budgets.domNodes],
])}

${markdownTable(['Route', 'Viewport', 'Navigation', 'Transfer', 'Decoded', 'DOM', 'Result'], rows.map((row) => [row.route, row.viewport, row.navigationMs == null ? '—' : `${Math.round(row.navigationMs)} ms`, humanBytes(row.transferBytes), humanBytes(row.decodedBytes), row.domNodes, row.issues.length ? `FAIL · ${row.issues.join('; ')}` : 'PASS']))}

## Boundary

These browser measurements are environment-specific and do not claim global production performance. Vercel or final hosting telemetry, database query evidence and real-user monitoring remain required after separately authorized deployment.
`
const paths = writeEvidence('PERFORMANCE_ACCEPTANCE', evidence, markdown)
console.log(`ANGELCARE Marketplace performance acceptance: ${status}`)
console.log(`Evidence: ${paths.latestMarkdown}`)
process.exitCode = status === 'PASS' ? 0 : 1
