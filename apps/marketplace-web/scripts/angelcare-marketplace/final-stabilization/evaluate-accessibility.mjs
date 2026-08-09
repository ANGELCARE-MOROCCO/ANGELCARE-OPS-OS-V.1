import fs from 'node:fs'
import path from 'node:path'
import { evidenceDirectory, writeEvidence, markdownTable } from './lib.mjs'

const directory = evidenceDirectory()
const visualFile = path.join(directory, 'VISUAL_ACCEPTANCE_LATEST.json')
if (!fs.existsSync(visualFile)) {
  console.error('FAIL: VISUAL_ACCEPTANCE_LATEST.json is required before accessibility evaluation.')
  process.exit(1)
}
const visual = JSON.parse(fs.readFileSync(visualFile, 'utf8'))
const rows = (visual.results || []).map((entry) => ({
  route: entry.route,
  viewport: entry.viewport,
  warnings: entry.accessibilityWarnings || [],
  lang: entry.dom?.lang || null,
  dir: entry.dom?.dir || null,
  h1Count: entry.dom?.h1Count ?? null,
}))
const warnings = rows.flatMap((row) => row.warnings.map((warning) => ({ route: row.route, viewport: row.viewport, warning })))
const missingProtected = !visual.storageStateSupplied || Number(visual.summary?.protectedRoutesCaptured || 0) === 0
const visualFailed = String(visual.status).toUpperCase() !== 'PASS'
const status = !visualFailed && !missingProtected && warnings.length === 0 ? 'PASS' : 'FAIL'
const evidence = {
  programme: 'ANGELCARE Marketplace Accessibility Acceptance',
  status,
  completedAt: new Date().toISOString(),
  visualEvidence: visualFile,
  summary: {
    captures: rows.length,
    warnings: warnings.length,
    protectedCaptured: !missingProtected,
  },
  warnings,
  rows,
}
const markdown = `# ANGELCARE Marketplace Accessibility Acceptance

**Status:** ${status}
**Browser captures:** ${rows.length}
**Automated accessibility warnings:** ${warnings.length}
**Protected routes captured:** ${missingProtected ? 'NO' : 'YES'}

${markdownTable(['Route', 'Viewport', 'Warnings', 'Lang', 'Direction', 'H1'], rows.map((row) => [row.route, row.viewport, row.warnings.length, row.lang || '—', row.dir || '—', row.h1Count ?? '—']))}

## Boundary

This gate covers automated rendered-page checks for accessible names, labels, duplicate IDs, headings, language, RTL, media alternatives and responsive overflow. Manual keyboard, screen-reader, contrast and business-language review remains mandatory evidence for executive launch approval.
`
const paths = writeEvidence('ACCESSIBILITY_ACCEPTANCE', evidence, markdown)
console.log(`ANGELCARE Marketplace accessibility acceptance: ${status}`)
console.log(`Evidence: ${paths.latestMarkdown}`)
process.exitCode = status === 'PASS' ? 0 : 1
