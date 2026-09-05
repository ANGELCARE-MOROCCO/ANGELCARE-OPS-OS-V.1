export const ANGELCARE360_WORKSPACE_ENTITLEMENT_REGISTRY = {
  'cockpit-direction': 'administration',
  administration: 'administration',
  people: 'people',
  admissions: 'admissions',
  presences: 'attendance',
  academique: 'academics',
  finance: 'finance',
  paie: 'payroll',
  transport: 'transport',
  bibliotheque: 'library',
  inventaire: 'inventory',
  messagerie: 'communications',
  reclamations: 'communications',
  rapports: 'reports',
} as const satisfies Record<string, string>

export type Angelcare360WorkspaceId = keyof typeof ANGELCARE360_WORKSPACE_ENTITLEMENT_REGISTRY
export type Angelcare360WorkspaceEntitlementKey = (typeof ANGELCARE360_WORKSPACE_ENTITLEMENT_REGISTRY)[Angelcare360WorkspaceId]

const COMMAND_CENTER_ROOT = '/angelcare-360-command-center'

type RouteWorkspaceBinding = {
  prefixes: readonly string[]
  workspaceId: Angelcare360WorkspaceId
}

/*
 * Customer route access must resolve through the same commercial workspace
 * authority as the sidebar. Product-constitution route bindings remain useful
 * for capabilities/features/operations, but they are not allowed to invent a
 * second module-entitlement namespace for whole-workspace access.
 */
export const ANGELCARE360_ROUTE_WORKSPACE_BINDINGS: readonly RouteWorkspaceBinding[] = [
  {
    workspaceId: 'administration',
    prefixes: [
      `${COMMAND_CENTER_ROOT}/administration`,
      `${COMMAND_CENTER_ROOT}/annees-scolaires`,
      `${COMMAND_CENTER_ROOT}/classes-sections`,
      `${COMMAND_CENTER_ROOT}/matieres`,
    ],
  },
  {
    workspaceId: 'people',
    prefixes: [
      `${COMMAND_CENTER_ROOT}/eleves`,
      `${COMMAND_CENTER_ROOT}/enseignants`,
      `${COMMAND_CENTER_ROOT}/familles`,
      `${COMMAND_CENTER_ROOT}/parents`,
      `${COMMAND_CENTER_ROOT}/personnel`,
      `${COMMAND_CENTER_ROOT}/personnes`,
      `${COMMAND_CENTER_ROOT}/relation-parents`,
    ],
  },
  { workspaceId: 'admissions', prefixes: [`${COMMAND_CENTER_ROOT}/admissions`] },
  { workspaceId: 'presences', prefixes: [`${COMMAND_CENTER_ROOT}/presences`] },
  {
    workspaceId: 'academique',
    prefixes: [
      `${COMMAND_CENTER_ROOT}/academique`,
      `${COMMAND_CENTER_ROOT}/emploi-du-temps`,
    ],
  },
  { workspaceId: 'finance', prefixes: [`${COMMAND_CENTER_ROOT}/finance`] },
  { workspaceId: 'paie', prefixes: [`${COMMAND_CENTER_ROOT}/paie`] },
  { workspaceId: 'transport', prefixes: [`${COMMAND_CENTER_ROOT}/transport`] },
  { workspaceId: 'bibliotheque', prefixes: [`${COMMAND_CENTER_ROOT}/bibliotheque`] },
  { workspaceId: 'inventaire', prefixes: [`${COMMAND_CENTER_ROOT}/inventaire`] },
  {
    workspaceId: 'messagerie',
    prefixes: [
      `${COMMAND_CENTER_ROOT}/messagerie`,
      `${COMMAND_CENTER_ROOT}/notifications`,
    ],
  },
  { workspaceId: 'reclamations', prefixes: [`${COMMAND_CENTER_ROOT}/reclamations`] },
  {
    workspaceId: 'rapports',
    prefixes: [
      `${COMMAND_CENTER_ROOT}/rapports`,
      `${COMMAND_CENTER_ROOT}/exports`,
      `${COMMAND_CENTER_ROOT}/documents`,
    ],
  },
  {
    workspaceId: 'cockpit-direction',
    prefixes: [COMMAND_CENTER_ROOT, `${COMMAND_CENTER_ROOT}/direction`],
  },
] as const

function normalizePathname(pathname: string) {
  const pathOnly = String(pathname || '').split(/[?#]/, 1)[0] || '/'
  if (pathOnly.length > 1 && pathOnly.endsWith('/')) return pathOnly.slice(0, -1)
  return pathOnly
}

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function getAngelcare360WorkspaceEntitlementKey(workspaceId: string) {
  return ANGELCARE360_WORKSPACE_ENTITLEMENT_REGISTRY[workspaceId as Angelcare360WorkspaceId] || null
}

export function getAngelcare360WorkspaceIdForPath(pathname: string): Angelcare360WorkspaceId | null {
  const normalized = normalizePathname(pathname)
  for (const binding of ANGELCARE360_ROUTE_WORKSPACE_BINDINGS) {
    if (binding.prefixes.some((prefix) => matchesPrefix(normalized, prefix))) return binding.workspaceId
  }
  return null
}

export function getAngelcare360WorkspaceEntitlementKeyForPath(pathname: string): Angelcare360WorkspaceEntitlementKey | null {
  const workspaceId = getAngelcare360WorkspaceIdForPath(pathname)
  return workspaceId ? ANGELCARE360_WORKSPACE_ENTITLEMENT_REGISTRY[workspaceId] : null
}
