import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const prefixes = [
  'app/(protected)/revenue-command-os',
  'app/api/revenue-command-os',
  'lib/revenue-command-os',
  'docs/revenue-command-os/phase-01',
  'scripts/revenue-command-os',
  'tests/revenue-command-os',
]
const explicit = [
  'supabase/migrations/20260720_revenue_command_os_phase1_foundation.sql',
  'tsconfig.revenue-os-phase1.json',
  'tsconfig.revenue-os-integration.json',
  'ANGELCARE_REVENUE_COMMAND_OS_PHASE1_FOUNDATION_REPORT.md',
]

function walk(relative) {
  const absolute = path.join(root, relative)
  if (!fs.existsSync(absolute)) return []
  const stat = fs.statSync(absolute)
  if (stat.isFile()) return [relative]
  return fs.readdirSync(absolute).flatMap((name) => walk(path.join(relative, name)))
}

const files = [...new Set([...prefixes.flatMap(walk), ...explicit])].sort()
const summary = files.map((file) => ({ file, bytes: fs.statSync(path.join(root, file)).size }))
console.log(JSON.stringify({ release: 'AC-REVENUE-OS-MZ01-FOUNDATION', files: summary, totalBytes: summary.reduce((sum, item) => sum + item.bytes, 0) }, null, 2))
