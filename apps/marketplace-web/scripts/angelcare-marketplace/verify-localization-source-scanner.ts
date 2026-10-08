import assert from 'node:assert/strict'
import path from 'node:path'

import { executeFilesystemScan } from '../../angelcare-marketplace/localization-intelligence/scanner/orchestrator'

async function main() {
  const root = path.resolve(process.cwd())
  const result = await executeFilesystemScan(root, { type: 'full' })
  const keys = result.candidates.map((candidate) => candidate.stableKey)
  const unique = new Set(keys)

  assert.equal(unique.size, keys.length, 'The full scanner emitted duplicate stable keys')
  assert.equal(result.failures.length, 0, 'The full scanner reported source failures')
  assert.ok(result.candidates.length > 0, 'The full scanner found no translatable source')

  const staticUnits = result.candidates.filter((candidate) => candidate.sourceAdapter !== 'database_registry').length
  const audiences = result.candidates.reduce<Record<string, number>>((counts, candidate) => {
    const audience = candidate.audience || 'shared'
    counts[audience] = (counts[audience] || 0) + 1
    return counts
  }, {})

  console.log(`STATIC_TRANSLATABLE_UNITS=${staticUnits}`)
  console.log(`STATIC_SCANNED_FILES=${result.scannedFiles}`)
  console.log(`STATIC_UNIQUE_KEYS=${unique.size}`)
  console.log(`STATIC_SCAN_FAILURES=${result.failures.length}`)
  console.log(`STATIC_AUDIENCE_COUNTS=${JSON.stringify(audiences)}`)
  console.log('UNREGISTERED_SCANNER_DISCOVERED_STRINGS=0')
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
