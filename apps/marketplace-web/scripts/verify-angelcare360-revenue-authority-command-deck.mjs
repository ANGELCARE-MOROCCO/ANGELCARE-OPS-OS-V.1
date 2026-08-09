#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const root = process.cwd()
let passed = 0
const fail = (message) => { throw new Error(message) }
const check = (condition, message) => { if (!condition) fail(message); passed += 1; console.log(`PASS  ${message}`) }
const read = (relative) => { const absolute = path.join(root, relative); check(fs.existsSync(absolute), `exists: ${relative}`); return fs.readFileSync(absolute, 'utf8') }

const files = [
  'components/angelcare360/operator/sovereign/revenue-authority/RevenueAuthorityCommandDeck.tsx',
  'components/angelcare360/operator/sovereign/revenue-authority/RevenueAuthorityCommandDeck.module.css',
  'components/angelcare360/operator/sovereign/SovereignWorkspaceClient.tsx',
  'data/angelcare360/operator-sovereign-navigation.ts',
  'components/brand/AngelCareLogo.tsx',
]

for (const relative of files) read(relative)

const component = read(files[0])
for (const marker of [
  'Revenue Authority',
  'From contracted value to secured cash',
  'Pricing authority',
  'Contract authority',
  'Subscription economics',
  'Billing production',
  'Cash & reconciliation',
  'Collections & exposure',
  'Forecast, leakage & profitability',
  'Financial action runway',
]) check(component.includes(marker), `Revenue Authority marker: ${marker}`)

for (const view of ['command','pricing','contracts','subscriptions','billing','cash','collections','forecast']) {
  check(component.includes(`'${view}'`), `Revenue Authority view: ${view}`)
}

for (const href of [
  '/angelcare-360-operator/plans',
  '/angelcare-360-operator/contracts',
  '/angelcare-360-operator/subscriptions',
  '/angelcare-360-operator/billing/invoices',
  '/angelcare-360-operator/billing/payments',
  '/angelcare-360-operator/billing/dunning',
  '/angelcare-360-operator/billing/balances',
  '/angelcare-360-operator/settings',
]) check(component.includes(href), `real operational destination: ${href}`)

const client = read(files[2])
check(client.includes("snapshot.tower === 'revenue'"), 'Revenue-only sovereign branch exists')
check(client.includes('<RevenueAuthorityCommandDeck'), 'Revenue Authority deck mounted')
check(client.includes('DirectionSovereignScene'), 'Direction scene preserved')
check(client.includes('GrowthSovereignScene'), 'Growth scene preserved')
check(client.includes('TenantSovereignScene'), 'Tenant scene preserved')
check(client.includes('ServiceSovereignScene'), 'Service scene preserved')
check(client.includes('PlatformSovereignScene'), 'Platform scene preserved')

const navigation = read(files[3])
for (const view of ['command','pricing','contracts','subscriptions','billing','cash','collections','forecast']) {
  check(navigation.includes(`/revenue?view=${view}`), `single Revenue navigation view: ${view}`)
}
check((navigation.match(/\/revenue\?view=/g) || []).length === 8, 'exactly eight Revenue Authority navigation links')

const logo = read(files[4])
check(logo.includes('identité officielle complète'), 'full official logo accessibility label')
check(logo.includes('className="object-contain"'), 'logo preserves natural aspect ratio')
check(!logo.includes('overflow-hidden rounded-xl'), 'logo is no longer trapped in compact square')
check(!logo.includes('p-1.5'), 'logo is not artificially compressed by internal padding')

for (const dead of ['href="javascript:', 'TODO_ACTION', 'onClick={() => {}}', 'alert(']) {
  check(!component.includes(dead), `dead-control marker absent: ${dead}`)
}

for (const relative of [files[0], files[2], files[3], files[4]]) {
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
      skipLibCheck: true,
    },
  })
  const errors = (result.diagnostics || []).filter((item) => item.category === ts.DiagnosticCategory.Error)
  check(errors.length === 0, `isolated syntax: ${relative}`)
}

const css = read(files[1])
for (const className of ['deck','authorityCrown','economicStrip','commandGrid','authorityQueue','circulationCanvas','contextInspector','actionRunway']) {
  check(css.includes(`.${className}`), `CSS architecture: ${className}`)
}

console.log(`\n${passed} surgical checks passed. Revenue Authority Command Deck is accepted.`)
