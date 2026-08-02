import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const root = process.cwd()

const files = [
  'components/angelcare360/operator/sovereign/platform-authority/PlatformSovereignFabric.tsx',
  'components/angelcare360/operator/sovereign/platform-authority/PlatformSovereignFabric.module.css',
  'components/brand/AngelCareLogo.tsx',
  'components/brand/AngelCareOwnershipFooter.tsx',
  'components/brand/AngelCareOwnershipFooter.module.css',
  'components/angelcare360/operator/sovereign/SovereignWorkspaceClient.tsx',
  'components/angelcare360/operator/Angelcare360OperatorShell.tsx',
  'data/angelcare360/operator-sovereign-navigation.ts',
  'public/brand/angelcare-official-inverse.webp',
]

let checks = 0
for (const relative of files) {
  const absolute = path.join(root, relative)
  if (!fs.existsSync(absolute)) throw new Error(`Missing required file: ${relative}`)
  if (fs.statSync(absolute).size === 0) throw new Error(`Empty required file: ${relative}`)
  console.log(`PASS  file: ${relative}`)
  checks += 1
}

for (const relative of files.filter((name) => /\.(ts|tsx)$/.test(name))) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8')
  const parsed = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true, relative.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  if (parsed.parseDiagnostics.length) throw new Error(`TypeScript syntax diagnostics in ${relative}`)
  console.log(`PASS  TypeScript syntax: ${relative}`)
  checks += 1
}

const componentPath = path.join(root, files[0])
const component = fs.readFileSync(componentPath, 'utf8')
const css = fs.readFileSync(path.join(root, files[1]), 'utf8')
const client = fs.readFileSync(path.join(root, files[5]), 'utf8')
const shell = fs.readFileSync(path.join(root, files[6]), 'utf8')
const navigation = fs.readFileSync(path.join(root, files[7]), 'utf8')
const logo = fs.readFileSync(path.join(root, files[2]), 'utf8')
const footer = fs.readFileSync(path.join(root, files[3]), 'utf8')

const viewMarkers = ['command','architecture','commercialization','packages','entitlements','population','runtime','governance']
for (const marker of viewMarkers) {
  if (!component.includes(`'${marker}'`)) throw new Error(`Missing Platform view: ${marker}`)
  console.log(`PASS  platform view: ${marker}`)
  checks += 1
}

const planeMatches = component.match(/\{ key: '[^']+', label: '[^']+' \}/g) || []
if (planeMatches.length !== 34) throw new Error(`Expected 34 internal planes; found ${planeMatches.length}`)
console.log('PASS  exactly 34 internal operating planes')
checks += 1

for (const marker of ['Semantic zoom','onPointerDown','onPointerMove','Five-state tenant entitlement twin','Offerability matrix','User population & seat economics','Provisioning Orchestrator','Monetization Leakage','ChangeRunway']) {
  if (!component.includes(marker)) throw new Error(`Missing Platform contract marker: ${marker}`)
  console.log(`PASS  contract marker: ${marker}`)
  checks += 1
}

for (const forbidden of ['setInterval(', 'ResizeObserver', 'animation: infinite', 'href="javascript:', 'TODO_ACTION', 'onClick={() => {}}', 'alert(']) {
  if (component.includes(forbidden) || css.includes(forbidden)) throw new Error(`Forbidden marker present: ${forbidden}`)
  console.log(`PASS  forbidden marker absent: ${forbidden}`)
  checks += 1
}

if (css.split('{').length !== css.split('}').length) throw new Error('Platform CSS braces are unbalanced')
console.log('PASS  Platform CSS braces balanced')
checks += 1

const styleRefs = [...component.matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((match) => match[1])
for (const className of new Set(styleRefs)) {
  if (!css.includes(`.${className}`)) throw new Error(`Missing CSS module class: ${className}`)
}
console.log(`PASS  ${new Set(styleRefs).size} Platform CSS module references resolve`)
checks += 1

for (const marker of ['RevenueAuthorityCommandDeck','ServiceIndustrialMissionNetwork','PlatformSovereignFabric']) {
  if (!client.includes(marker)) throw new Error(`Sovereign composition missing: ${marker}`)
  console.log(`PASS  sovereign composition: ${marker}`)
  checks += 1
}

if (!shell.includes('AngelCareOwnershipFooter')) throw new Error('Global Operator ownership footer is not mounted')
console.log('PASS  global Operator ownership footer mounted')
checks += 1

for (const marker of ['angelcare-official.webp','angelcare-official-inverse.webp','data-logo-variant']) {
  if (!logo.includes(marker)) throw new Error(`Official logo contract missing: ${marker}`)
  console.log(`PASS  logo contract: ${marker}`)
  checks += 1
}

for (const marker of ['ANGELCARE OWNED SANILA OS','ENGINEERED AND DESIGNED BY AISSAOUI ILYASS','COPYRIGHT © 2026 ANGELCARE']) {
  if (!footer.includes(marker)) throw new Error(`Ownership footer marker missing: ${marker}`)
  console.log(`PASS  ownership marker: ${marker}`)
  checks += 1
}

for (const marker of ['Platform Command','Product Architecture','Sellable Engineering','Package Governance','Entitlement Compiler','Population & Capacity','Runtime & Release','Economics & Policy']) {
  if (!navigation.includes(marker)) throw new Error(`Platform navigation missing: ${marker}`)
  console.log(`PASS  navigation: ${marker}`)
  checks += 1
}

console.log(`\n${checks} surgical checks passed. Platform Sovereign Fabric is accepted.`)
