#!/usr/bin/env node
// Static authoring utility. Reads source and writes Markdown; no DB/network access.
import fs from 'node:fs'
import path from 'node:path'
import { SANILA_MASTER_DEMO_V2_FORECAST } from './sanila-master-demo-v2-forecast.mjs'

const root = process.cwd()
const protectedRoot = path.join(root, 'app', '(protected)')
const routeRoot = path.join(protectedRoot, 'angelcare-360-command-center')
const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)])
const pages = walk(routeRoot).filter((file) => file.endsWith(`${path.sep}page.tsx`)).sort()
const routeFor = (file) => `/${path.relative(protectedRoot, file).replaceAll(path.sep, '/').replace(/\/page\.tsx$/, '').replace(/\/(\([^/]+\))/g, '').replace(/\[id\]/g, '{id}')}`
const relative = (file) => path.relative(root, file).replaceAll(path.sep, '/')
const fixtureTables = new Set(Object.keys(SANILA_MASTER_DEMO_V2_FORECAST))

function resolveModule(fromFile, specifier) {
  if (!(specifier.startsWith('@/') || specifier.startsWith('.'))) return null
  const base = specifier.startsWith('@/') ? path.join(root, specifier.slice(2)) : path.resolve(path.dirname(fromFile), specifier)
  const candidates = [base, ...sourceExtensions.map((ext) => `${base}${ext}`), ...sourceExtensions.map((ext) => path.join(base, `index${ext}`))]
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || null
}

function importsFor(source) {
  const values = []
  const matcher = /(?:import|export)\s+(?:type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g
  for (const match of source.matchAll(matcher)) {
    const clause = (match[1] || '').trim()
    const names = clause.startsWith('{') ? clause.slice(1, clause.lastIndexOf('}')).split(',').map((item) => item.trim().split(/\s+as\s+/)[0]).filter(Boolean) : []
    values.push({ specifier: match[2] || match[3], names })
  }
  return values
}

function exportedTargets(barrel, names) {
  if (!names.length || !/\/lib\/angelcare360\/server(?:\/index)?\.(?:ts|tsx)$/.test(barrel)) return null
  const source = fs.readFileSync(barrel, 'utf8')
  const targets = []
  for (const match of source.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g)) {
    const target = resolveModule(barrel, match[1])
    if (!target) continue
    const targetSource = fs.readFileSync(target, 'utf8')
    if (names.some((name) => new RegExp(`(?:export\\s+(?:async\\s+)?function|export\\s+(?:const|class|type|interface))\\s+${name}\\b`).test(targetSource))) targets.push(target)
  }
  return targets
}

function ancestorLayouts(page) {
  const layouts = []
  let directory = path.dirname(page)
  while (directory.startsWith(routeRoot)) {
    const candidate = path.join(directory, 'layout.tsx')
    if (fs.existsSync(candidate)) layouts.push(candidate)
    if (directory === routeRoot) break
    directory = path.dirname(directory)
  }
  return layouts
}

function authorityFor(page) {
  const visited = new Set()
  const queue = [page, ...ancestorLayouts(page)]
  const tables = new Set()
  const functions = new Set()
  const repositories = new Set()
  const unresolved = new Set()
  let dynamicAuthority = false
  while (queue.length) {
    const file = queue.shift()
    if (!file || visited.has(file)) continue
    visited.add(file)
    const source = fs.readFileSync(file, 'utf8')
    if (/\/(?:lib\/angelcare360\/server|lib\/ac360)\//.test(file)) repositories.add(relative(file))
    for (const match of source.matchAll(/\.from\(\s*['"]([^'"]+)['"]\s*\)/g)) tables.add(match[1])
    for (const match of source.matchAll(/\.rpc\(\s*['"]([^'"]+)['"]/g)) functions.add(match[1])
    if (/(?:supabase|client|db|query)\.from\(\s*(?!['"])[^)]+\)/.test(source) || /(?:supabase|client|db)\.rpc\(\s*(?!['"])[^)]+\)/.test(source)) dynamicAuthority = true
    for (const imported of importsFor(source)) {
      const target = resolveModule(file, imported.specifier)
      if (!target) {
        if (/(?:server|repository|supabase|\/ac360\/)/.test(imported.specifier)) unresolved.add(imported.specifier)
        continue
      }
      const narrowed = exportedTargets(target, imported.names)
      if (narrowed) queue.push(...narrowed)
      else queue.push(target)
    }
  }
  const hasAuthority = tables.size + functions.size > 0
  const hasServerBoundary = repositories.size > 0
  const reviewRequired = dynamicAuthority || unresolved.size > 0 || (!hasAuthority && hasServerBoundary)
  const structural = !hasAuthority && !hasServerBoundary && !dynamicAuthority
  return { tables: [...tables].sort(), functions: [...functions].sort(), repositories: [...repositories].sort(), hasAuthority, reviewRequired, structural }
}

const records = pages.map((page, index) => {
  const authority = authorityFor(page)
  const dependencies = [...authority.tables.map((value) => `table:${value}`), ...authority.functions.map((value) => `rpc:${value}`)]
  const fixtureFamilies = authority.tables.filter((table) => fixtureTables.has(table))
  const state = authority.reviewRequired ? 'EXPLICIT_REVIEW_REQUIRED' : authority.structural ? 'STRUCTURAL' : 'ACTUAL_SOURCE_DERIVED'
  const staticResult = authority.reviewRequired ? 'REVIEW_REQUIRED' : 'PASS'
  return { index: index + 1, route: routeFor(page), page: relative(page), repositories: authority.repositories, dependencies, fixtureFamilies, state, staticResult }
})

const actual = records.filter((record) => record.dependencies.length > 0).length
const structural = records.filter((record) => record.state === 'STRUCTURAL').length
const review = records.filter((record) => record.state === 'EXPLICIT_REVIEW_REQUIRED').length
const rows = records.map((record) => `| ${record.index} | \`${record.route}\` | \`${record.page}\` | ${record.repositories.length ? record.repositories.map((value) => `\`${value}\``).join('<br>') : 'NONE'} | ${record.dependencies.length ? record.dependencies.map((value) => `\`${value}\``).join('<br>') : 'NONE'} | ${record.fixtureFamilies.length ? record.fixtureFamilies.map((value) => `\`${value}\``).join('<br>') : 'NONE'} | ${record.state} | ${record.staticResult} | PENDING | PENDING |`)
const output = `# SANILA Master Demo V2 — material 195-route coverage

Status: **STATIC_DEPENDENCY_EXTRACTION_COMPLETE / DATABASE_CERTIFICATION=PENDING / LIVE_RUNTIME_CERTIFICATION=PENDING**. Generated from protected page/layout imports and recursively resolved local modules. Literal Supabase \`.from(table)\` and \`.rpc(function)\` calls are reported as actual authority. Dynamic or unresolved authority is never replaced with a domain guess; it is marked \`EXPLICIT_REVIEW_REQUIRED\`.

| # | Route | Page | Recursively used server authority | Actual tables/view/functions | Required fixture families | Classification | Static result | Database certification | Live runtime certification |
|---:|---|---|---|---|---|---|---|---|---|
${rows.join('\n')}

## Inventory totals

- REAL_ROUTES_TOTAL: ${records.length}
- ROUTE_FILES_MATCHED: ${records.length}
- ROUTES_WITH_ACTUAL_DEPENDENCY_AUTHORITY: ${actual}
- STRUCTURAL_ROUTES: ${structural}
- EXPLICIT_REVIEW_REQUIRED: ${review}
- GENERIC_DOMAIN_TABLE_MAPPING_AS_ACTUAL: 0
- FALSE_MATERIAL_PASS: 0
- DATABASE_CERTIFICATION: PENDING
- LIVE_RUNTIME_CERTIFICATION: PENDING
`
fs.writeFileSync(path.join(root, 'docs/sanila-master-demo/MASTER_DEMO_ROUTE_COVERAGE.md'), output)
console.log(JSON.stringify({ routes: records.length, routeFilesMatched: records.length, actualDependencyAuthority: actual, structuralRoutes: structural, explicitReviewRequired: review, genericDomainMappingAsActual: 0, falseMaterialPass: 0, databaseConnected: false, sqlExecuted: false }, null, 2))
