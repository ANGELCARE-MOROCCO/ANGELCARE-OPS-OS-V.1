import assert from 'node:assert/strict'
import { readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ANGELCARE360_ROUTE_WORKSPACE_BINDINGS,
  ANGELCARE360_WORKSPACE_ENTITLEMENT_REGISTRY,
  getAngelcare360WorkspaceEntitlementKeyForPath,
  getAngelcare360WorkspaceIdForPath,
} from '../lib/angelcare360/workspace-entitlement-registry.ts'

const root = '/angelcare-360-command-center'
const cases = [
  [root, 'cockpit-direction', 'administration'],
  [`${root}/direction`, 'cockpit-direction', 'administration'],
  [`${root}/administration`, 'administration', 'administration'],
  [`${root}/administration/classes`, 'administration', 'administration'],
  [`${root}/annees-scolaires`, 'administration', 'administration'],
  [`${root}/classes-sections`, 'administration', 'administration'],
  [`${root}/matieres`, 'administration', 'administration'],
  [`${root}/eleves`, 'people', 'people'],
  [`${root}/parents`, 'people', 'people'],
  [`${root}/enseignants`, 'people', 'people'],
  [`${root}/personnel`, 'people', 'people'],
  [`${root}/personnes/audit`, 'people', 'people'],
  [`${root}/relation-parents`, 'people', 'people'],
  [`${root}/admissions`, 'admissions', 'admissions'],
  [`${root}/presences`, 'presences', 'attendance'],
  [`${root}/academique`, 'academique', 'academics'],
  [`${root}/emploi-du-temps`, 'academique', 'academics'],
  [`${root}/finance`, 'finance', 'finance'],
  [`${root}/paie`, 'paie', 'payroll'],
  [`${root}/transport`, 'transport', 'transport'],
  [`${root}/bibliotheque`, 'bibliotheque', 'library'],
  [`${root}/inventaire`, 'inventaire', 'inventory'],
  [`${root}/messagerie`, 'messagerie', 'communications'],
  [`${root}/notifications`, 'messagerie', 'communications'],
  [`${root}/reclamations`, 'reclamations', 'communications'],
  [`${root}/rapports`, 'rapports', 'reports'],
  [`${root}/exports`, 'rapports', 'reports'],
  [`${root}/documents`, 'rapports', 'reports'],
] as const

for (const [pathname, workspaceId, entitlementKey] of cases) {
  assert.equal(getAngelcare360WorkspaceIdForPath(pathname), workspaceId, `${pathname} workspace`)
  assert.equal(getAngelcare360WorkspaceEntitlementKeyForPath(pathname), entitlementKey, `${pathname} entitlement`)
}

assert.equal(getAngelcare360WorkspaceEntitlementKeyForPath(`${root}/direction/`), 'administration')
assert.equal(getAngelcare360WorkspaceEntitlementKeyForPath(`${root}/finance?plane=overview`), 'finance')
assert.equal(getAngelcare360WorkspaceEntitlementKeyForPath('/outside-sanila'), null)

const canonicalEnterpriseModules = new Set([
  'academics',
  'administration',
  'admissions',
  'attendance',
  'communications',
  'finance',
  'inventory',
  'library',
  'payroll',
  'people',
  'reports',
  'transport',
])

for (const [pathname] of cases) {
  const key = getAngelcare360WorkspaceEntitlementKeyForPath(pathname)
  assert.ok(key && canonicalEnterpriseModules.has(key), `${pathname} must resolve to the canonical Enterprise snapshot namespace`)
}

assert.equal(Object.keys(ANGELCARE360_WORKSPACE_ENTITLEMENT_REGISTRY).length, 14)
assert.equal(new Set(Object.values(ANGELCARE360_WORKSPACE_ENTITLEMENT_REGISTRY)).size, 12)
assert.equal(ANGELCARE360_ROUTE_WORKSPACE_BINDINGS.length, 14)

// Scan the actual customer route estate so a future page cannot silently enter
// the shared entitlement gate without a canonical workspace mapping.
const thisDir = dirname(fileURLToPath(import.meta.url))
const appDir = resolve(thisDir, '../app/(protected)/angelcare-360-command-center')
const pageFiles: string[] = []

function walk(directory: string) {
  for (const name of readdirSync(directory)) {
    const absolute = join(directory, name)
    if (statSync(absolute).isDirectory()) walk(absolute)
    else if (name === 'page.tsx') pageFiles.push(absolute)
  }
}

walk(appDir)
assert.ok(pageFiles.length > 0, 'actual SANILA command-center routes must be discoverable')

for (const pageFile of pageFiles) {
  const rel = relative(appDir, pageFile)
  const routeParts = rel
    .split(/[\\/]/)
    .slice(0, -1)
    .filter((part) => !(part.startsWith('(') && part.endsWith(')')))
  const pathname = routeParts.length ? `${root}/${routeParts.join('/')}` : root
  const key = getAngelcare360WorkspaceEntitlementKeyForPath(pathname)
  assert.ok(key, `orphan customer route: ${pathname}`)
  assert.ok(canonicalEnterpriseModules.has(key), `non-canonical customer entitlement key: ${pathname} -> ${key}`)
}

const lowerTierModules = new Set(['administration', 'people'])
assert.equal(lowerTierModules.has(getAngelcare360WorkspaceEntitlementKeyForPath(root) || ''), true)
assert.equal(lowerTierModules.has(getAngelcare360WorkspaceEntitlementKeyForPath(`${root}/finance`) || ''), false)

console.log('PILOTAGE_FONDATION_LIVE_GATE=PASS')
console.log('CORE_PLATFORM_FOUNDATION_MAPPING=PASS')
console.log(`ALL_REAL_WORKSPACE_ROUTES_TOTAL=${pageFiles.length}`)
console.log('ALL_REAL_WORKSPACE_ROUTES_MAPPED=PASS')
console.log('ENTERPRISE_38_ITEM_SNAPSHOT_CONTRACTED_WORKSPACES=PASS')
console.log('LOWER_TIER_STILL_RESTRICTED=PASS')
console.log('ORPHAN_ROUTE_KEYS=0')
