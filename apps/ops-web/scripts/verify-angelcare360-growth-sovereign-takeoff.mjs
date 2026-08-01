import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const root = process.cwd()

const exactFiles = [
  'app/(protected)/angelcare-360-operator/growth/page.tsx',
  'components/angelcare360/operator/growth-sovereign/GrowthSovereignTakeoff.tsx',
  'components/angelcare360/operator/growth-sovereign/GrowthSovereignTakeoff.module.css',
  'components/angelcare360/operator/growth/GrowthOperatingSystem.module.css',
]

let checks = 0
for (const relative of exactFiles) {
  const absolute = path.join(root, relative)
  if (!fs.existsSync(absolute)) throw new Error(`Missing exact takeoff file: ${relative}`)
  console.log(`PASS  exact takeoff file: ${relative}`)
  checks += 1
}

const tsTargets = exactFiles.filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
for (const relative of tsTargets) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8')
  const result = ts.transpileModule(source, {
    fileName: relative,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.Preserve,
      isolatedModules: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    },
  })
  const errors = (result.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error)
  if (errors.length) throw new Error(`Isolated syntax failed: ${relative}`)
  console.log(`PASS  isolated syntax: ${relative}`)
  checks += 1
}

const growthTypes = fs.readFileSync(path.join(root, 'types/angelcare360/operator/growth.ts'), 'utf8')
for (const name of ['GrowthProductOption', 'GrowthWorkspaceSnapshot', 'GrowthMode']) {
  if (!growthTypes.includes(`export interface ${name}`) && !growthTypes.includes(`export type ${name}`)) {
    throw new Error(`Stable Growth export missing: ${name}`)
  }
  console.log(`PASS  stable Growth export preserved: ${name}`)
  checks += 1
}

const growthLib = fs.readFileSync(path.join(root, 'lib/angelcare360/operator/growth.ts'), 'utf8')
for (const name of ['loadGrowthWorkspaceSnapshot', 'executeGrowthOperation']) {
  if (!growthLib.includes(`export async function ${name}`)) throw new Error(`Stable Growth backend export missing: ${name}`)
  console.log(`PASS  stable Growth backend export preserved: ${name}`)
  checks += 1
}

const stableOperatingSystem = fs.readFileSync(path.join(root, 'components/angelcare360/operator/growth/GrowthOperatingSystem.tsx'), 'utf8')
if (!stableOperatingSystem.includes('GrowthWorkspaceSnapshot')) throw new Error('Stable GrowthOperatingSystem contract was altered unexpectedly.')
console.log('PASS  stable GrowthOperatingSystem contract preserved')
checks += 1

const page = fs.readFileSync(path.join(root, exactFiles[0]), 'utf8')
for (const marker of ['GrowthSovereignTakeoff', 'loadGrowthWorkspaceSnapshot', 'normalizeGrowthMode']) {
  if (!page.includes(marker)) throw new Error(`Growth page integration marker missing: ${marker}`)
  console.log(`PASS  page integration marker: ${marker}`)
  checks += 1
}

const frame = fs.readFileSync(path.join(root, exactFiles[1]), 'utf8')
for (const marker of ['Revenue Relationship Command Universe', 'GrowthOperatingSystem', 'GrowthWorkspaceSnapshot', 'Customer & Growth Sovereign OS']) {
  if (!frame.includes(marker)) throw new Error(`Takeoff frame marker missing: ${marker}`)
  console.log(`PASS  takeoff frame marker: ${marker}`)
  checks += 1
}

for (const forbidden of ['TODO_ACTION', 'href="javascript:', 'onClick={() => {}}', 'alert(']) {
  if (page.includes(forbidden) || frame.includes(forbidden)) throw new Error(`Forbidden dead-control marker found: ${forbidden}`)
  console.log(`PASS  dead-control marker absent: ${forbidden}`)
  checks += 1
}

console.log(`\n${checks} surgical checks passed. Customer & Growth Sovereign Takeoff is accepted.`)
