#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
const require = createRequire(import.meta.url)
let ts
try {
  ts = require('typescript')
} catch {
  const globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim()
  ts = require(path.join(globalRoot, 'typescript', 'lib', 'typescript.js'))
}

const root = process.cwd()
const revenueRoot = path.join(root, 'app', '(protected)', 'revenue-command-os')
const failures = []
const notes = []

const fail = (message) => failures.push(message)
const assert = (condition, message) => { if (!condition) fail(message) }
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

function walk(dir, extensions) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full, extensions))
    else if (extensions.has(path.extname(entry.name))) out.push(full)
  }
  return out
}

assert(fs.existsSync(revenueRoot), `Revenue OS root missing: ${revenueRoot}`)

const codeFiles = walk(revenueRoot, new Set(['.ts', '.tsx'])).filter((file) => !file.endsWith('.d.ts'))
let syntaxDiagnostics = 0
for (const file of codeFiles) {
  const source = fs.readFileSync(file, 'utf8')
  const result = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      isolatedModules: true,
    },
  })
  for (const diagnostic of result.diagnostics || []) {
    if (diagnostic.category === ts.DiagnosticCategory.Error) {
      syntaxDiagnostics += 1
      fail(`TS syntax: ${path.relative(root, file)} · ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`)
    }
  }
}
notes.push(`TS/TSX isolated syntax files: ${codeFiles.length}; diagnostics: ${syntaxDiagnostics}`)

const strategy = read('app/(protected)/revenue-command-os/strategy-engine/page.tsx')
assert(!strategy.includes('<SIcon'), 'Strategy Engine still renders client SIcon from a Server Component')
assert(!/import\s*\{[^}]*\bSIcon\b[^}]*\}\s*from\s*['"][^'"]*SovereignPrimitives/.test(strategy), 'Strategy Engine still imports SIcon')
assert(strategy.includes('function StrategyStaticIcon'), 'Server-safe StrategyStaticIcon is missing')
assert(strategy.includes('data-revenue-route="strategy-engine"'), 'Strategy route semantic scope missing')
notes.push('Strategy Server/Client boundary: server-safe icon rendering present')

const errorPage = read('app/(protected)/revenue-command-os/error.tsx')
assert(errorPage.includes('data-revenue-route="error-boundary"'), 'Revenue error boundary route scope missing')
assert(errorPage.includes('data-revenue-surface="dark"'), 'Revenue error boundary dark surface contract missing')
assert(errorPage.includes('text-white'), 'Revenue error boundary title is not explicitly white')
notes.push('Revenue error boundary: explicit dark/light contrast contract present')

const visualCss = read('app/(protected)/revenue-command-os/_components/RevenueVisualIntegrity.module.css')
assert(visualCss.includes('Final production contrast certification'), 'Final contrast certification block missing')
assert(visualCss.includes('[data-revenue-component="chip"]'), 'Semantic chip contract missing')
assert(visualCss.includes('[data-revenue-route="error-boundary"]'), 'Error contrast override missing')
assert(!/\[role=["']dialog["']\][^\{]*(?:aside|article|section)[^\{]*\{[^}]*max-width\s*:\s*100%/s.test(visualCss), 'Forbidden generic dialog geometry override found')

const drawerCss = read('app/(protected)/revenue-command-os/_components/drawer-sovereignty/DrawerSovereignty.module.css')
assert(drawerCss.includes('Portal drawer contrast certification'), 'Portal drawer contrast block missing')
assert(drawerCss.includes('[data-drawer-surface="dark"]'), 'Dark drawer surface contract missing')
assert(!/:global\([^)]*\)\s*(?:,\s*:global\([^)]*\))*\s*\{/.test(drawerCss), 'Pure-global CSS Module selector found')

for (const css of walk(revenueRoot, new Set(['.css']))) {
  const source = fs.readFileSync(css, 'utf8')
  let depth = 0
  for (const char of source.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (char === '{') depth += 1
    if (char === '}') depth -= 1
    if (depth < 0) break
  }
  assert(depth === 0, `CSS brace imbalance: ${path.relative(root, css)}`)
}
notes.push('CSS Modules: structural brace and selector safety checks passed')

const drawerPrimitives = read('app/(protected)/revenue-command-os/_components/drawer-sovereignty/DrawerPrimitives.tsx')
for (const token of ['data-revenue-component="drawer-panel"', 'data-revenue-component="drawer-action"', 'data-revenue-component="drawer-footer"']) {
  assert(drawerPrimitives.includes(token), `Drawer semantic token missing: ${token}`)
}
for (const relative of [
  'app/(protected)/revenue-command-os/signals/_components/SignalDrawer.tsx',
  'app/(protected)/revenue-command-os/memory-learning/_components/DoctrineDrawer.tsx',
  'app/(protected)/revenue-command-os/digital-twin/_components/DigitalTwinEntityDrawer.tsx',
  'app/(protected)/revenue-command-os/cockpit/_components/PremiumRevenueCockpit.tsx',
]) {
  assert(read(relative).includes('data-drawer-surface="dark"'), `Drawer header contract missing: ${relative}`)
}
notes.push('Shared portal drawers: semantic surfaces and action contracts present')

const pages = walk(revenueRoot, new Set(['.tsx'])).filter((file) => path.basename(file) === 'page.tsx')
assert(pages.length >= 18, `Route inventory unexpectedly shallow: ${pages.length}`)
notes.push(`Revenue route page inventory: ${pages.length}`)

// Relative import existence, including extension/index resolution.
const candidates = (base) => [
  base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`,
  path.join(base, 'index.ts'), path.join(base, 'index.tsx'), path.join(base, 'index.js'), path.join(base, 'index.jsx'),
]
for (const file of codeFiles) {
  const source = fs.readFileSync(file, 'utf8')
  for (const match of source.matchAll(/(?:from\s+|import\s*\()\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const base = path.resolve(path.dirname(file), match[1])
    assert(candidates(base).some(fs.existsSync), `Unresolved relative import: ${path.relative(root, file)} -> ${match[1]}`)
  }
}
notes.push('Relative import verification passed')

if (failures.length) {
  console.error('FINAL PRODUCTION CLOSURE VERIFICATION FAILED')
  for (const item of failures) console.error(`- ${item}`)
  process.exit(2)
}

console.log('FINAL PRODUCTION CLOSURE SOURCE VERIFICATION PASSED')
for (const item of notes) console.log(`✓ ${item}`)
console.log('Scope: Strategy runtime boundary · error state · Revenue contrast · portal drawers · routes · imports')
