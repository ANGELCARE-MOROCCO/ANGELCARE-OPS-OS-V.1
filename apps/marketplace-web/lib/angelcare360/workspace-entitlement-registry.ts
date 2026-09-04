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

export function getAngelcare360WorkspaceEntitlementKey(workspaceId: string) {
  return ANGELCARE360_WORKSPACE_ENTITLEMENT_REGISTRY[workspaceId as keyof typeof ANGELCARE360_WORKSPACE_ENTITLEMENT_REGISTRY] || null
}
