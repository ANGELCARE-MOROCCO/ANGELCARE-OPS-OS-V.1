import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const canonicalPath = path.join(root, 'packages/browser-extension-contracts/b2b-capabilities.v1.json')
const canonical = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'))
const errors = []
if (canonical.capabilityCount !== 45) errors.push(`Expected 45 capabilities, found ${canonical.capabilityCount}`)
if (canonical.capabilities.length !== 45) errors.push(`Capability array contains ${canonical.capabilities.length}`)
const ids = new Set(); const keys = new Set(); const commands = new Set()
for (const item of canonical.capabilities) {
  if (ids.has(item.id)) errors.push(`Duplicate id: ${item.id}`)
  if (keys.has(item.key)) errors.push(`Duplicate key: ${item.key}`)
  ids.add(item.id); keys.add(item.key)
  if (!item.permission) errors.push(`${item.id} missing permission`)
  if (!item.auditRequired) errors.push(`${item.id} must require audit`)
  if (!Array.isArray(item.commands) || item.commands.length === 0) errors.push(`${item.id} missing commands`)
  for (const command of item.commands || []) commands.add(command)
  if (!Array.isArray(item.acceptanceTests) || item.acceptanceTests.length < 2) errors.push(`${item.id} missing acceptance test mapping`)
}
const hash = crypto.createHash('sha256').update(fs.readFileSync(canonicalPath)).digest('hex')
const mirrors = [
  'apps/ops-web/lib/browser-extension/generated/b2b-capabilities.v1.json',
  'apps/revenue-browser-extension/src/generated/b2b-capabilities.v1.json',
]
for (const relative of mirrors) {
  const full = path.join(root, relative)
  if (!fs.existsSync(full)) errors.push(`Missing mirror: ${relative}`)
  else {
    const mirrorHash = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex')
    if (mirrorHash !== hash) errors.push(`Out-of-sync mirror: ${relative}`)
  }
}

for (const filename of ['b2b-account-intelligence.v2.json', 'b2b-revenue-execution.v3.json', 'b2b-deal-closing.v4.json', 'b2b-partner-lifecycle.v5.json', 'b2b-ai-sales-director.v6.json', 'b2b-production-final.v7.json', 'b2b-scanner-intelligence.v7_1.json', 'b2b-ultra-reality.v9.json']) {
  const source = path.join(root, 'packages/browser-extension-contracts', filename)
  if (!fs.existsSync(source)) {
    errors.push(`Missing implementation supplement: ${filename}`)
    continue
  }
  const sourceHash = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')
  for (const targetRoot of [
    'apps/ops-web/lib/browser-extension/generated',
    'apps/revenue-browser-extension/src/generated',
  ]) {
    const target = path.join(root, targetRoot, filename)
    if (!fs.existsSync(target)) errors.push(`Missing supplement mirror: ${targetRoot}/${filename}`)
    else {
      const targetHash = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')
      if (targetHash !== sourceHash) errors.push(`Out-of-sync supplement mirror: ${targetRoot}/${filename}`)
    }
  }
}
if (errors.length) {
  console.error('B2B contract verification FAILED')
  for (const error of errors) console.error(` - ${error}`)
  process.exit(1)
}
console.log('ANGELCARE B2B Browser Extension Contract V1')
console.log(`Capabilities defined: ${canonical.capabilities.length}/45`)
console.log(`Commands registered: ${commands.size}`)
console.log(`Permissions mapped: ${canonical.capabilities.filter((x) => x.permission).length}/45`)
console.log(`Audit mapped: ${canonical.capabilities.filter((x) => x.auditRequired).length}/45`)
console.log(`Acceptance mappings: ${canonical.capabilities.filter((x) => x.acceptanceTests.length >= 2).length}/45`)
console.log(`Contract SHA-256: ${hash}`)
console.log('STATUS: CONTRACT FOUNDATION COMPLETE')
