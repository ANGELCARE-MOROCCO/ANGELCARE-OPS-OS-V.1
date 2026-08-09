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
    throw new Error(`TypeScript is required: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const required = [
  'app/(protected)/angelcare-360-operator/growth/page.tsx',
  'app/api/angelcare360/operator/growth/route.ts',
  'components/angelcare360/operator/growth/GrowthContract.ts',
  'components/angelcare360/operator/growth/GrowthOperatingSystem.tsx',
  'components/angelcare360/operator/growth/GrowthOperatingSystem.module.css',
  'components/angelcare360/operator/growth/GrowthPortal.tsx',
  'components/angelcare360/operator/growth/CustomerSovereignCommandRoom.tsx',
  'data/angelcare360/operator-sovereign-navigation.ts',
  'lib/angelcare360/operator/growth.ts',
  'types/angelcare360/operator/growth.ts',
  'supabase/migrations/20260731_angelcare360_operator_revenue_relationship_sovereign_os.sql',
  'tsconfig.angelcare360-commercial-growth.json',
]
let checks = 0
let failed = false
const pass = (label) => { checks += 1; console.log(`PASS  ${label}`) }
const fail = (label) => { failed = true; console.error(`FAIL  ${label}`) }
const read = (rel) => fs.readFileSync(path.join(app, rel), 'utf8')
const expect = (rel, pattern, label) => (typeof pattern === 'string' ? read(rel).includes(pattern) : pattern.test(read(rel))) ? pass(label) : fail(label)
for (const rel of required) fs.existsSync(path.join(app, rel)) ? pass(`file exists: ${rel}`) : fail(`missing file: ${rel}`)

const masterModes = ['command','markets','pipeline','offers','contracts','portfolio','health','performance']
const navSource = read('data/angelcare360/operator-sovereign-navigation.ts')
const contractSource = read('components/angelcare360/operator/growth/GrowthContract.ts')
for (const mode of masterModes) {
  contractSource.includes(`key: '${mode}'`) ? pass(`master scene declared: ${mode}`) : fail(`master scene declared: ${mode}`)
  navSource.includes(`?view=${mode}`) ? pass(`master route declared: ${mode}`) : fail(`master route declared: ${mode}`)
}
for (const obsolete of ['?view=contacts','?view=renewals']) navSource.includes(obsolete) ? fail(`obsolete duplicate master route removed: ${obsolete}`) : pass(`obsolete duplicate master route removed: ${obsolete}`)
const modeDeclarations = [...contractSource.matchAll(/key:\s*'([^']+)'/g)].map((match) => match[1])
modeDeclarations.length === 8 ? pass('exactly eight master scenes') : fail(`exactly eight master scenes (${modeDeclarations.length})`)
const operating = read('components/angelcare360/operator/growth/GrowthOperatingSystem.tsx')
operating.includes('GROWTH_MODES.map') ? fail('no duplicate internal master navigation') : pass('no duplicate internal master navigation')
expect('components/angelcare360/operator/growth/GrowthOperatingSystem.tsx', 'localModeRail', 'contextual local rail remains distinct')

for (const scene of [
  'RevenueCommandScene','MarketsScene','PipelineScene','OffersNegotiationScene','ContractsActivationScene',
  'PortfolioConstellationScene','RetentionRecoveryScene','RevenuePerformanceScene',
]) expect('components/angelcare360/operator/growth/GrowthOperatingSystem.tsx', `function ${scene}`, `purpose-built scene ${scene}`)
for (const visual of [
  'valueMovementField','marketAtlas','dealTheatre','solutionLab','activationArchitecture',
  'customerConstellation','recoveryCommandSystem','revenueObservatory',
]) expect('components/angelcare360/operator/growth/GrowthOperatingSystem.tsx', `styles.${visual}`, `distinct visual system ${visual}`)

const dossier = read('components/angelcare360/operator/growth/CustomerSovereignCommandRoom.tsx')
expect('components/angelcare360/operator/growth/CustomerSovereignCommandRoom.tsx', 'Customer Sovereign Command Room', 'embedded sovereign customer dossier')
expect('components/angelcare360/operator/growth/CustomerSovereignCommandRoom.tsx', 'customerSpine', 'vertical dossier command spine')
expect('components/angelcare360/operator/growth/CustomerSovereignCommandRoom.tsx', 'CustomerProductControlPanel', 'Product Kernel embedded in dossier')
expect('components/angelcare360/operator/growth/CustomerSovereignCommandRoom.tsx', 'Support, réclamations & incidents', 'support and complaints command scene')
for (const section of ['overview','identity','influence','institutions','strategy','offers','contracts','product','finance','cases','service','renewal','audit']) {
  contractSource.includes(`['${section}'`) ? pass(`customer dossier section ${section}`) : fail(`customer dossier section ${section}`)
}
const dossierCount = [...contractSource.matchAll(/^\s*\['(overview|identity|influence|institutions|strategy|offers|contracts|product|finance|cases|service|renewal|audit)'/gm)].length
dossierCount === 13 ? pass('exactly thirteen customer dossier sections') : fail(`exactly thirteen customer dossier sections (${dossierCount})`)

const portal = read('components/angelcare360/operator/growth/GrowthPortal.tsx')
for (const entity of ['client','prospect','contact','institution','opportunity','stakeholder','offer','negotiation','contract','subscription','case','interaction','expansion','intervention']) {
  portal.includes(`'${entity}'`) ? pass(`portal entity ${entity}`) : fail(`portal entity ${entity}`)
}
for (const capability of ['createPortal(', "document.body.style.overflow = 'hidden'", "event.key === 'Escape'", 'ImpactSidecar', 'DeleteChamber', 'ConversionChamber', 'ActivationChamber']) {
  portal.includes(capability) ? pass(`portal capability ${capability}`) : fail(`portal capability ${capability}`)
}
for (const phrase of ['Package Product Studio','Plan de facturation','Ticket, plainte, incident, SLA, résolution et outcome','Solution Engineering Lab','Deal Execution Theatre']) {
  portal.includes(phrase) ? pass(`purpose-built portal marker ${phrase}`) : fail(`purpose-built portal marker ${phrase}`)
}

const lib = read('lib/angelcare360/operator/growth.ts')
for (const table of ['growth_institutions','growth_stakeholders','growth_offer_versions','growth_negotiations','customer_cases','customer_case_events','commercial_findings']) {
  lib.includes(`angelcare360_operator_${table}`) ? pass(`server domain table ${table}`) : fail(`server domain table ${table}`)
}
for (const op of ['prospect.convert','prospect.merge','offer.convert_contract','contract.activate']) {
  const [entity, verb] = op.split('.')
  lib.includes(`entityName === '${entity}' && verb === '${verb}'`) ? pass(`governed operation ${op}`) : fail(`governed operation ${op}`)
}
for (const marker of ['snapshotOfferVersion','compileTenantEntitlements','angelcare360_operator_onboarding_tasks','createCaseEvent']) lib.includes(marker) ? pass(`server synchronization ${marker}`) : fail(`server synchronization ${marker}`)

const css = read('components/angelcare360/operator/growth/GrowthOperatingSystem.module.css')
for (const rel of [
  'components/angelcare360/operator/growth/GrowthOperatingSystem.tsx',
  'components/angelcare360/operator/growth/GrowthPortal.tsx',
  'components/angelcare360/operator/growth/CustomerSovereignCommandRoom.tsx',
]) {
  const refs = [...read(rel).matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((match) => match[1])
  for (const name of [...new Set(refs)]) {
    const pattern = new RegExp(`\\.${name}(?=[,{.:\\s])`)
    pattern.test(css) ? pass(`CSS resolves ${rel}: ${name}`) : fail(`missing CSS ${name} used by ${rel}`)
  }
}

const rawUuid = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i
for (const rel of required.filter((item) => /\.(tsx?|css)$/.test(item))) rawUuid.test(read(rel)) ? fail(`raw UUID literal absent ${rel}`) : pass(`raw UUID literal absent ${rel}`)
for (const dead of ['onClick={() => undefined}', 'href="javascript:', 'TODO_ACTION']) {
  const combined = operating + portal + dossier
  combined.includes(dead) ? fail(`dead-control marker absent: ${dead}`) : pass(`dead-control marker absent: ${dead}`)
}

const ts = await loadTypeScript()
for (const rel of required.filter((item) => /\.tsx?$/.test(item))) {
  const result = ts.transpileModule(read(rel), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve }, reportDiagnostics: true, fileName: rel })
  const errors = (result.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error)
  if (errors.length) { fail(`TypeScript syntax ${rel}`); for (const error of errors) console.error(ts.flattenDiagnosticMessageText(error.messageText, '\n')) }
  else pass(`TypeScript syntax ${rel}`)
}
if (failed) process.exit(1)
console.log(`\n${checks} checks passed. Revenue Relationship Sovereign OS is statically accepted.`)
