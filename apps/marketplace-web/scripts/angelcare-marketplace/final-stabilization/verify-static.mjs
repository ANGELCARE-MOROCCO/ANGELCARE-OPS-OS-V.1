import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  projectRoot,
  walk,
  normalize,
  importProjectTypeScript,
  nextRouteFromFile,
  routeRegex,
  writeEvidence,
  markdownTable,
} from './lib.mjs'

const root = projectRoot()
const startedAt = new Date().toISOString()
const checks = []
const findings = []

function check(id, passed, details = '', severity = 'critical') {
  const record = { id, passed: Boolean(passed), details, severity }
  checks.push(record)
  process.stdout.write(`${record.passed ? '  ✓' : severity === 'critical' ? '  ✗' : '  !'} ${id}${details ? ` — ${details}` : ''}\n`)
  return record.passed
}

function filesIn(relative, pattern) {
  return walk(relative).filter((file) => pattern.test(file))
}

function fileText(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8')
}

console.log('ANGELCARE Marketplace — Final Stabilization Static Authority')
console.log(`Root: ${root}`)
console.log(`Started: ${startedAt}`)

for (const required of [
  'angelcare-marketplace',
  'app/angelcare-marketplace',
  'app/api/angelcare-marketplace',
  'scripts/angelcare-marketplace',
  'supabase/migrations',
  'public/angelcare-marketplace/homepage',
]) {
  check(`required root ${required}`, fs.existsSync(path.join(root, required)))
}

const verifierFiles = filesIn('scripts/angelcare-marketplace', /\/verify-[^/]+\.mjs$/)
  .filter((file) => !file.endsWith('/verify-typescript-deployment-batches.mjs') && !file.includes('/final-stabilization/'))

const verifierResults = []
for (const verifier of verifierFiles) {
  const result = spawnSync(process.execPath, [path.join(root, verifier)], {
    cwd: root,
    env: { ...process.env, TERM: 'dumb' },
    encoding: 'utf8',
    timeout: 180_000,
    maxBuffer: 32 * 1024 * 1024,
  })
  const output = `${result.stdout || ''}${result.stderr || ''}`
  const passed = result.status === 0 && !result.error
  verifierResults.push({ verifier, passed, status: result.status, output: output.slice(-12_000) })
  check(`contract verifier ${path.basename(verifier)}`, passed, passed ? 'passed' : output.trim().slice(-500))
}

const sourceRoots = [
  'angelcare-marketplace',
  'app/angelcare-marketplace',
  'app/api/angelcare-marketplace',
  'scripts/angelcare-marketplace',
]
const sourceFiles = [...new Set(sourceRoots.flatMap((base) => filesIn(base, /\.(?:ts|tsx|mts|cts)$/)))]
const typescript = await importProjectTypeScript(root)
const syntaxDiagnostics = []
for (const relative of sourceFiles) {
  const absolute = path.join(root, relative)
  const source = fs.readFileSync(absolute, 'utf8')
  const kind = relative.endsWith('.tsx') ? typescript.ScriptKind.TSX : typescript.ScriptKind.TS
  const sourceFile = typescript.createSourceFile(absolute, source, typescript.ScriptTarget.Latest, true, kind)
  for (const diagnostic of sourceFile.parseDiagnostics || []) {
    const location = diagnostic.start == null
      ? null
      : sourceFile.getLineAndCharacterOfPosition(diagnostic.start)
    syntaxDiagnostics.push({
      file: relative,
      line: location ? location.line + 1 : null,
      column: location ? location.character + 1 : null,
      message: typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    })
  }
}
check('TypeScript/TSX parse syntax', syntaxDiagnostics.length === 0, `${sourceFiles.length} files · ${syntaxDiagnostics.length} diagnostics`)
if (syntaxDiagnostics.length) findings.push(...syntaxDiagnostics.map((item) => ({ category: 'syntax', ...item })))

const moduleExtensions = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.scss', '.sass', '.less', '.d.ts']
const importPattern = /(?:from\s*|import\s*\(|require\s*\()\s*["']([^"']+)["']/g
const missingImports = []
function resolveLocal(base) {
  const candidates = []
  for (const extension of moduleExtensions) candidates.push(`${base}${extension}`)
  for (const extension of moduleExtensions) candidates.push(path.join(base, `index${extension}`))
  return candidates.some((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
}
for (const relative of sourceFiles) {
  const absolute = path.join(root, relative)
  const source = fs.readFileSync(absolute, 'utf8')
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1]
    let base = null
    if (specifier.startsWith('.')) base = path.resolve(path.dirname(absolute), specifier)
    else if (specifier.startsWith('@/')) base = path.resolve(root, specifier.slice(2))
    if (base && !resolveLocal(base)) missingImports.push({ file: relative, specifier })
  }
}
check('relative and alias import closure', missingImports.length === 0, `${missingImports.length} missing modules`)
if (missingImports.length) findings.push(...missingImports.map((item) => ({ category: 'missing-import', ...item })))

const cssIssues = []
const cssPurityIssues = []
const cssImportPattern = /import\s+(\w+)\s+from\s+["']([^"']+\.module\.css)["']/g
for (const relative of sourceFiles.filter((file) => /\.(?:ts|tsx)$/.test(file))) {
  const absolute = path.join(root, relative)
  const source = fs.readFileSync(absolute, 'utf8')
  for (const match of source.matchAll(cssImportPattern)) {
    const variable = match[1]
    const specifier = match[2]
    const cssPath = specifier.startsWith('@/')
      ? path.join(root, specifier.slice(2))
      : path.resolve(path.dirname(absolute), specifier)
    if (!fs.existsSync(cssPath)) {
      cssIssues.push({ file: relative, css: normalize(path.relative(root, cssPath)), issue: 'missing stylesheet' })
      continue
    }
    const css = fs.readFileSync(cssPath, 'utf8')
    const declared = new Set([...css.matchAll(/(?<![\w-])\.([A-Za-z_][\w-]*)/g)].map((entry) => entry[1]))
    const dotReference = new RegExp(`\\b${variable}\\.([A-Za-z_][\\w]*)`, 'g')
    const bracketReference = new RegExp(`\\b${variable}\\[["']([A-Za-z_][\\w-]*)["']\\]`, 'g')
    const used = new Set([
      ...[...source.matchAll(dotReference)].map((entry) => entry[1]),
      ...[...source.matchAll(bracketReference)].map((entry) => entry[1]),
    ])
    for (const className of used) {
      if (!declared.has(className)) cssIssues.push({ file: relative, css: normalize(path.relative(root, cssPath)), className, issue: 'missing class' })
    }
  }
}
const cssModules = [...new Set([
  ...filesIn('angelcare-marketplace', /\.module\.css$/),
  ...filesIn('app/angelcare-marketplace', /\.module\.css$/),
])]
for (const relative of cssModules) {
  const lines = fileText(relative).split(/\r?\n/)
  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('@') || trimmed.startsWith('/*') || !trimmed.includes('{')) return
    const selector = trimmed.split('{', 1)[0]
    for (const part of selector.split(',')) {
      const candidate = part.trim()
      if (candidate === '*' || candidate === 'html' || candidate === 'body' || candidate === ':root' || /^(?:html|body|:root|\*)\s/.test(candidate)) {
        cssPurityIssues.push({ file: relative, line: index + 1, selector: candidate })
      }
    }
  })
}
check('CSS Module class authority', cssIssues.length === 0, `${cssModules.length} modules · ${cssIssues.length} issues`)
check('CSS Module selector purity', cssPurityIssues.length === 0, `${cssPurityIssues.length} unscoped selectors`)
if (cssIssues.length) findings.push(...cssIssues.map((item) => ({ category: 'css', ...item })))
if (cssPurityIssues.length) findings.push(...cssPurityIssues.map((item) => ({ category: 'css-purity', ...item })))

const appFiles = walk('app').filter((file) => /\/(?:page\.(?:ts|tsx)|route\.(?:ts|js))$/.test(file))
const routes = appFiles.map((file) => ({ file, ...nextRouteFromFile(file) })).filter((item) => item.route)
const routePatterns = routes.map((route) => ({ ...route, pattern: routeRegex(route.route) }))
const literalLinks = new Map()
const hrefPatterns = [
  /href\s*=\s*["'`]([^"'`$]+)["'`]/g,
  /href\s*:\s*["'`]([^"'`$]+)["'`]/g,
]
for (const relative of sourceFiles.filter((file) => /\.(?:ts|tsx)$/.test(file))) {
  const source = fileText(relative)
  for (const pattern of hrefPatterns) {
    for (const match of source.matchAll(pattern)) {
      const href = match[1]
      if (!href.startsWith('/angelcare-marketplace')) continue
      if (!literalLinks.has(href)) literalLinks.set(href, new Set())
      literalLinks.get(href).add(relative)
    }
  }
}
const deadLinks = []
for (const [href, owners] of literalLinks) {
  const pathname = href.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/'
  if (!routePatterns.some((route) => route.pattern.test(pathname))) {
    deadLinks.push({ href, owners: [...owners] })
  }
}
const pageRoutes = routes.filter((route) => route.kind === 'page')
const apiRoutes = routes.filter((route) => route.kind === 'api')
check('Marketplace route estate', routes.length >= 500, `${pageRoutes.length} pages · ${apiRoutes.length} APIs`)
check('literal Marketplace CTA destinations', deadLinks.length === 0, `${literalLinks.size} links · ${deadLinks.length} unresolved`)
if (deadLinks.length) findings.push(...deadLinks.map((item) => ({ category: 'dead-link', ...item })))

const assetReferencePattern = /["'](\/angelcare-marketplace\/[^"']+?\.(?:svg|png|jpe?g|webp|avif|gif|ico|woff2?|ttf|otf|mp4|webm|pdf))["']/gi
const assetReferences = new Map()
for (const relative of [
  ...sourceFiles,
  ...filesIn('supabase/migrations', /angelcare_marketplace.*\.sql$/i),
  ...cssModules,
]) {
  const source = fileText(relative)
  for (const match of source.matchAll(assetReferencePattern)) {
    const asset = match[1]
    if (!assetReferences.has(asset)) assetReferences.set(asset, new Set())
    assetReferences.get(asset).add(relative)
  }
}
const missingAssets = []
for (const [asset, owners] of assetReferences) {
  if (!fs.existsSync(path.join(root, 'public', asset.replace(/^\//, '')))) {
    missingAssets.push({ asset, owners: [...owners] })
  }
}
const homepageAssets = filesIn('public/angelcare-marketplace/homepage', /\.svg$/)
const requiredHomepageAssets = [
  'hero-family-marketplace.svg', 'hero-academy-marketplace.svg', 'hero-partner-os.svg',
  'hero-international.svg', 'family-showcase.svg', 'category-universal.svg',
  'category-family.svg', 'category-development.svg', 'category-kits.svg',
  'category-academy.svg', 'category-institutions.svg', 'category-hospitality.svg',
  'category-health.svg', 'category-corporate.svg', 'category-partner-os.svg',
  'category-quality.svg', 'item-home-care.svg', 'item-recurring-care.svg',
  'item-mother-baby.svg', 'item-after-school.svg', 'item-montessori.svg',
  'item-autonomy-kit.svg', 'item-academy-safety.svg', 'item-academy-montessori.svg',
  'item-school-diagnostic.svg', 'item-hospitality.svg', 'item-corporate.svg',
  'item-partner-os.svg', 'item-quality-check.svg',
]
const absentRequiredAssets = requiredHomepageAssets.filter((name) => !homepageAssets.some((file) => file.endsWith(`/${name}`)))
check('referenced Marketplace media integrity', missingAssets.length === 0, `${assetReferences.size} references · ${missingAssets.length} missing`)
check('Homepage responsive visual estate', homepageAssets.length >= 29 && absentRequiredAssets.length === 0, `${homepageAssets.length} SVG assets · ${absentRequiredAssets.length} required missing`)
if (missingAssets.length) findings.push(...missingAssets.map((item) => ({ category: 'missing-asset', ...item })))

const productionSourceFiles = sourceFiles.filter((file) => !file.startsWith('scripts/'))
const forbiddenPatterns = [
  ['@ts-ignore', /@ts-ignore|@ts-nocheck|@ts-expect-error/],
  ['unsafe any', /\bas any\b|:\s*any\b|\bany\[\]/],
  ['build bypass', /ignoreBuildErrors\s*:\s*true/],
  ['localStorage persistence', /\blocalStorage\b/],
  ['placeholder debt', /lorem ipsum|TODO\s*:/i],
]
const forbiddenFindings = []
for (const relative of productionSourceFiles) {
  const source = fileText(relative)
  for (const [label, pattern] of forbiddenPatterns) {
    if (pattern.test(source)) forbiddenFindings.push({ file: relative, label })
  }
}
check('production source suppression and placeholder scan', forbiddenFindings.length === 0, `${forbiddenFindings.length} findings`)
if (forbiddenFindings.length) findings.push(...forbiddenFindings.map((item) => ({ category: 'forbidden-source', ...item })))

const permissionTypes = fileText('angelcare-marketplace/domain/types.ts')
const requiredPermissions = [
  'marketplace.intelligence.view',
  'marketplace.intelligence.metrics.manage',
  'marketplace.growth.view',
  'marketplace.growth.experiments.manage',
  'marketplace.performance.view',
  'marketplace.security.assess',
  'marketplace.launch.approve',
  'marketplace.launch.monitoring',
]
const missingPermissions = requiredPermissions.filter((permission) => !permissionTypes.includes(`'${permission}'`))
check('Final Authority TypeScript permission alignment', missingPermissions.length === 0, `${missingPermissions.length} missing permissions`)

const migrations = filesIn('supabase/migrations', /angelcare_marketplace.*\.sql$/i).sort()
const rollbackFiles = filesIn('angelcare-marketplace/database/rollback', /\.sql$/i)
const sqlFindings = []
let cumulativeSql = ''
for (const migration of migrations) {
  const sql = fileText(migration)
  cumulativeSql += `\n${sql}`
  for (const [label, pattern] of [
    ['drop table', /\bdrop\s+table\b/i],
    ['drop column', /\bdrop\s+column\b/i],
    ['truncate table', /\btruncate(?:\s+table)?\b/i],
  ]) {
    if (pattern.test(sql)) sqlFindings.push({ file: migration, label })
  }
}
const createdTables = new Set([...cumulativeSql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-zA-Z0-9_]+)/gi)].map((entry) => entry[1]))
const rlsTables = new Set([...cumulativeSql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?public\.([a-zA-Z0-9_]+)\s+enable\s+row\s+level\s+security/gi)].map((entry) => entry[1]))
for (const migration of migrations) {
  const sql = fileText(migration)
  const dynamicLoopPattern = /foreach\s+\w+\s+in\s+array\s+array\[([\s\S]*?)\]\s+loop([\s\S]*?)end loop/gi
  for (const match of sql.matchAll(dynamicLoopPattern)) {
    if (!/enable row level security/i.test(match[2])) continue
    for (const tableMatch of match[1].matchAll(/'([a-zA-Z0-9_]+)'/g)) {
      rlsTables.add(tableMatch[1])
    }
  }
}
const missingRls = [...createdTables].filter((table) => table.startsWith('angelcare_marketplace_') && !rlsTables.has(table))
check('ordered Marketplace migration estate', migrations.length >= 25, `${migrations.length} migrations · ${rollbackFiles.length} rollback files`)
check('non-destructive Marketplace migrations', sqlFindings.length === 0, `${sqlFindings.length} destructive statements`)
check('Marketplace-created table RLS coverage', missingRls.length === 0, `${createdTables.size} tables · ${missingRls.length} without RLS`)
if (sqlFindings.length) findings.push(...sqlFindings.map((item) => ({ category: 'sql-destructive', ...item })))
if (missingRls.length) findings.push(...missingRls.map((table) => ({ category: 'sql-rls', table })))

const searchRoute = fileText('app/api/angelcare-marketplace/discovery/search/route.ts')
const searchRouteLines = searchRoute.split(/\r?\n/).filter((line) => line.trim()).length
check('Discovery search thin API adapter', searchRouteLines <= 3, `${searchRouteLines} non-empty lines`)
const homepageCss = fileText('angelcare-marketplace/homepage-flagship/homepage.module.css')
check('Homepage hero eyebrow CSS authority', homepageCss.includes('.heroEyebrow{'))

const criticalFailures = checks.filter((entry) => !entry.passed && entry.severity === 'critical')
const warnings = checks.filter((entry) => !entry.passed && entry.severity !== 'critical')
const status = criticalFailures.length === 0 ? 'PASS' : 'FAIL'
const completedAt = new Date().toISOString()

const evidence = {
  programme: 'ANGELCARE Marketplace Final Stabilization',
  startedAt,
  completedAt,
  status,
  summary: {
    checks: checks.length,
    passed: checks.filter((entry) => entry.passed).length,
    failed: criticalFailures.length,
    warnings: warnings.length,
    sourceFiles: sourceFiles.length,
    routes: routes.length,
    pageRoutes: pageRoutes.length,
    apiRoutes: apiRoutes.length,
    literalLinks: literalLinks.size,
    cssModules: cssModules.length,
    homepageAssets: homepageAssets.length,
    migrations: migrations.length,
    rollbackFiles: rollbackFiles.length,
  },
  checks,
  findings,
  verifierResults,
  routes: routes.map(({ route, kind, file }) => ({ route, kind, file })),
}

const markdown = `# ANGELCARE Marketplace Final Stabilization — Static Acceptance

**Status:** ${status}
**Started:** ${startedAt}
**Completed:** ${completedAt}

## Summary

${markdownTable(['Measure', 'Value'], [
  ['Checks', checks.length],
  ['Passed', checks.filter((entry) => entry.passed).length],
  ['Critical failures', criticalFailures.length],
  ['Warnings', warnings.length],
  ['TypeScript/TSX source files', sourceFiles.length],
  ['Marketplace routes', routes.length],
  ['Page routes', pageRoutes.length],
  ['API routes', apiRoutes.length],
  ['Literal internal links', literalLinks.size],
  ['CSS Modules', cssModules.length],
  ['Homepage SVG assets', homepageAssets.length],
  ['Marketplace migrations', migrations.length],
])}

## Gate results

${markdownTable(['Gate', 'Result', 'Details'], checks.map((entry) => [entry.id, entry.passed ? 'PASS' : 'FAIL', entry.details]))}

## Contract boundary

This report proves source-level and static contractual integrity. It does not claim a production build, authenticated runtime workflow, database backup restoration, live payment, live notification delivery, production performance, or executive production authorization.
`

const paths = writeEvidence('STATIC_ACCEPTANCE', evidence, markdown)
console.log(`\n${status} ${checks.filter((entry) => entry.passed).length}/${checks.length}`)
console.log(`Evidence JSON: ${paths.latestJson}`)
console.log(`Evidence report: ${paths.latestMarkdown}`)
process.exitCode = status === 'PASS' ? 0 : 1
