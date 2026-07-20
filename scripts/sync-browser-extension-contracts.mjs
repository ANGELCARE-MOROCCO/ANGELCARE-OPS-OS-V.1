import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'packages/browser-extension-contracts/b2b-capabilities.v1.json')
const modulesSource = path.join(root, 'packages/browser-extension-contracts/module-catalog.v1.json')
const contractRaw = fs.readFileSync(source)
const contract = JSON.parse(contractRaw.toString('utf8'))
const modules = JSON.parse(fs.readFileSync(modulesSource, 'utf8'))

const targets = [
  path.join(root, 'apps/ops-web/lib/browser-extension/generated/b2b-capabilities.v1.json'),
  path.join(root, 'apps/revenue-browser-extension/src/generated/b2b-capabilities.v1.json'),
]
const moduleTargets = [
  path.join(root, 'apps/ops-web/lib/browser-extension/generated/module-catalog.v1.json'),
  path.join(root, 'apps/revenue-browser-extension/src/generated/module-catalog.v1.json'),
]
for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, contractRaw)
}
for (const target of moduleTargets) {
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, JSON.stringify(modules, null, 2) + '\n')
}

const supplements = [
  'b2b-account-intelligence.v2.json',
  'b2b-revenue-execution.v3.json',
  'b2b-deal-closing.v4.json',
  'b2b-partner-lifecycle.v5.json',
  'b2b-ai-sales-director.v6.json',
]
for (const filename of supplements) {
  const supplementSource = path.join(root, 'packages/browser-extension-contracts', filename)
  if (!fs.existsSync(supplementSource)) continue
  const raw = fs.readFileSync(supplementSource)
  for (const targetRoot of [
    'apps/ops-web/lib/browser-extension/generated',
    'apps/revenue-browser-extension/src/generated',
  ]) {
    const target = path.join(root, targetRoot, filename)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, raw)
  }
}

console.log(`Synced ${contract.capabilityCount} B2B contracts, ${modules.modules.length} module descriptors and ${supplements.length} implementation supplements.`)
