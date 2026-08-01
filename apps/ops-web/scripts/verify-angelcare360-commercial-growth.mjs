#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const app = process.cwd()
const require = createRequire(import.meta.url)

async function loadTypeScript() {
  try { return require('typescript') } catch {}
  try {
    const root = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim()
    return (await import(pathToFileURL(path.join(root, 'typescript/lib/typescript.js')).href)).default
  } catch (error) {
    throw new Error(`TypeScript is required for verification: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const required = [
  'app/(protected)/angelcare-360-operator/growth/page.tsx',
  'app/api/angelcare360/operator/growth/route.ts',
  'components/angelcare360/operator/growth/GrowthContract.ts',
  'components/angelcare360/operator/growth/GrowthOperatingSystem.tsx',
  'components/angelcare360/operator/growth/GrowthOperatingSystem.module.css',
  'components/angelcare360/operator/growth/GrowthPortal.tsx',
  'lib/angelcare360/operator/growth.ts',
  'types/angelcare360/operator/growth.ts',
  'supabase/migrations/20260731_angelcare360_operator_commercial_growth_customer_os.sql',
  'tsconfig.angelcare360-commercial-growth.json',
]

let checks = 0
function pass(label) { checks += 1; console.log(`PASS  ${label}`) }
function fail(label) { console.error(`FAIL  ${label}`); process.exitCode = 1 }
function source(rel) { return fs.readFileSync(path.join(app, rel), 'utf8') }
function expect(rel, pattern, label) {
  const ok = typeof pattern === 'string' ? source(rel).includes(pattern) : pattern.test(source(rel))
  ok ? pass(label) : fail(label)
}

for (const rel of required) fs.existsSync(path.join(app, rel)) ? pass(`file exists: ${rel}`) : fail(`missing file: ${rel}`)

const modes = ['command','markets','pipeline','portfolio','contacts','offers','contracts','renewals','health','performance']
for (const mode of modes) {
  expect('components/angelcare360/operator/growth/GrowthContract.ts', `key: '${mode}'`, `scene declared: ${mode}`)
  expect('data/angelcare360/operator-sovereign-navigation.ts', `?view=${mode}`, `horizontal route declared: ${mode}`)
}

for (const title of [
  'Commercial movement field','Market territory atlas','Deal-flow lanes','Customer constellation',
  'Influence network','Product configuration canvas','Commercial obligation architecture',
  'Renewal horizon room','Intervention command field','Revenue conversion observatory',
]) expect('components/angelcare360/operator/growth/GrowthOperatingSystem.tsx', title, `purpose-built scene: ${title}`)

for (const entity of ['prospect','contact','opportunity','offer','interaction','expansion','intervention']) {
  expect('lib/angelcare360/operator/growth.ts', `${entity}: 'angelcare360_operator_growth_`, `table map: ${entity}`)
  for (const verb of ['create','update','transition','delete']) {
    expect('lib/angelcare360/operator/growth.ts', `verb === '${verb}'`, `operation router supports ${verb}`)
  }
}

for (const operation of ['prospect.convert','offer.convert_contract']) {
  const [entity, verb] = operation.split('.')
  expect('lib/angelcare360/operator/growth.ts', `entityName === '${entity}' && verb === '${verb}'`, `conversion operation: ${operation}`)
}

for (const signal of [
  'Product Studio disponible','configuration_snapshot','price_book_id','package_version_id',
  'Offre acceptée','Abonnement','Tenant','Entitlement',
]) {
  const all = source('components/angelcare360/operator/growth/GrowthOperatingSystem.tsx') + source('components/angelcare360/operator/growth/GrowthPortal.tsx') + source('lib/angelcare360/operator/growth.ts')
  all.includes(signal) ? pass(`synchronization marker: ${signal}`) : fail(`missing synchronization marker: ${signal}`)
}

expect('components/angelcare360/operator/growth/GrowthPortal.tsx', 'createPortal(content, document.body)', 'viewport portal uses document.body')
expect('components/angelcare360/operator/growth/GrowthPortal.tsx', "document.body.style.overflow = 'hidden'", 'portal locks body scroll')
expect('components/angelcare360/operator/growth/GrowthPortal.tsx', "event.key === 'Escape'", 'portal supports Escape')
expect('components/angelcare360/operator/growth/GrowthPortal.tsx', 'La mutation est persistée, auditée', 'portal explains persistence and audit')
expect('components/angelcare360/operator/growth/GrowthPortal.tsx', 'Sélectionner dans Product Studio', 'offer composer uses controlled Product Studio selector')
expect('components/angelcare360/operator/growth/GrowthPortal.tsx', 'Sélectionner un client', 'humanized client selector exists')
expect('components/angelcare360/operator/growth/GrowthPortal.tsx', 'Sélectionner un prospect', 'humanized prospect selector exists')

const rawUuid = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i
for (const rel of required.filter((item)=>/\.(tsx?|css)$/.test(item))) rawUuid.test(source(rel)) ? fail(`raw UUID literal in ${rel}`) : pass(`no raw UUID literal: ${rel}`)

const css = source('components/angelcare360/operator/growth/GrowthOperatingSystem.module.css')
for (const rel of ['components/angelcare360/operator/growth/GrowthOperatingSystem.tsx','components/angelcare360/operator/growth/GrowthPortal.tsx']) {
  const refs = [...source(rel).matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((match)=>match[1])
  for (const name of [...new Set(refs)]) {
    const pattern = new RegExp(`\\.${name}(?=[,{.:\\s])`)
    pattern.test(css) ? pass(`CSS module resolves ${rel}: ${name}`) : fail(`missing CSS class ${name} used by ${rel}`)
  }
}

const ts = await loadTypeScript()
for (const rel of required.filter((item)=>/\.tsx?$/.test(item))) {
  const result = ts.transpileModule(source(rel), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve },
    reportDiagnostics: true,
    fileName: rel,
  })
  const errors = (result.diagnostics || []).filter((item)=>item.category === ts.DiagnosticCategory.Error)
  if (errors.length) {
    fail(`TypeScript syntax: ${rel}`)
    for (const error of errors) console.error(ts.flattenDiagnosticMessageText(error.messageText, '\n'))
  } else pass(`TypeScript syntax: ${rel}`)
}

if (process.exitCode) process.exit(process.exitCode)
console.log(`\n${checks} checks passed. Commercial Growth & Customer Portfolio OS is statically accepted.`)
